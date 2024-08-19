import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai';
import { pull } from 'langchain/hub';
import { ChatPromptTemplate, PromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import path from 'node:path';
import { OllamaEmbeddings } from '@langchain/ollama';
import { HumanMessage, AIMessage, AIMessageChunk } from '@langchain/core/messages';
import { ChatOllama } from '@langchain/ollama';
import { createRetrievalChain } from 'langchain/chains/retrieval';
import { Readable } from 'node:stream';
import { readFileSync } from 'node:fs';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { TaskType } from '@google/generative-ai';
import { Document } from '@langchain/core/documents';

const loader = new PDFLoader(path.join(process.cwd(), 'data.pdf'));
console.log('HI');

const systemPrompt = `You are a home repair and maintenance assistant. Your goal is to help users identify and solve issues related to their homes, such as leaks, structural problems, appliance malfunctions, or other common household issues. You can analyze images to identify problems and suggest solutions. Answer only in plain text, DO NOT use Markdown
Chat History: {chat_history}
Guidelines:


1. For text-based inquiries:
   - Provide clear, concise advice.
   - Recommend common solutions or best practices for the problem described.
   - Ask relevant follow-up questions if more details are needed.

2. Always use plain text in your responses, with no Markdown.
3. After identifying an issue, generate 3 brief follow-up questions the user might ask next. Enclose these questions in double angle brackets. Example:
<<What should I do next?>>
<<Can I fix this myself, or do I need a professional?>>
<<How can I prevent this from happening again?>>

5. After detecting an issue, ask the user if they would like to take services to address the problem. If the user says "yes," respond with the following message: "Great! Please fill out this form to proceed with your service request: YOUR_FORM_LINK_HERE".
6. If you cannot provide a definitive answer, offer general advice and ask the user for more details.

Your responses should be brief, actionable, and focused on solving the user's problem.


SOURCES:
{context}`;

const imageDetectionPrompt = `
Assistant helps users with questions and support requests regarding home repair and maintenance services. The assistant can analyze images to identify issues such as leaks, structural problems, or other common household concerns. Be brief in your answers. Answer only in plain text, DO NOT use Markdown.

When analyzing an image:

1. Describe what you observe in the image.
2. Identify any potential issues that might be present based on common home repair scenarios.
3. Suggest possible solutions or next steps.
4. If unsure, provide general advice relevant to the situation and ask clarifying questions to gather more information.

If an image doesn't provide enough information to make a clear determination, ask for additional details instead of saying you don't know.

Generate 3 very brief follow-up questions that the user would likely ask next based on the detected issue. Enclose the follow-up questions in double angle brackets. Example:
<<What should I do next?>>
<<Do you offer repair services for this issue?>>
<<How can I prevent this problem from happening again?>>

Do not repeat questions that have already been asked. Make sure the last question ends with ">>".
SOURCES:
{context}
`;

let chat_history: any[] = [];

interface P {
	context: Document[];
	answer: string;
}
export async function* createJsonStream(chunks: AsyncIterable<AIMessageChunk | P>) {
	for await (const chunk of chunks) {
		if ('answer' in chunk) {
			const responseChunk = {
				content: chunk.answer,
				role: 'assistant',
			};

			yield responseChunk;
		}

		if ('content' in chunk) {
			const responseChunk = {
				content: chunk.content,
				role: 'assistant',
			};

			yield responseChunk;
		}
	}
}

export async function loadAndProcessDocuments() {
	const docs = await loader.load();
	const textSplitter = new RecursiveCharacterTextSplitter({
		chunkSize: 500,
		chunkOverlap: 200,
	});
	return await textSplitter.splitDocuments(docs);
}

export async function initializeChains(splits: Document<Record<string, any>>[]) {
	const embeddings = new GoogleGenerativeAIEmbeddings({
		model: 'text-embedding-004',
		taskType: TaskType.RETRIEVAL_DOCUMENT,
		apiKey: process.env.GEMINI_API_KEY,
	});

	const model = new ChatGoogleGenerativeAI({
		model: 'gemini-1.5-flash',
		temperature: 0,
		maxRetries: 2,
		apiKey: process.env.GEMINI_API_KEY,
	});

	const vectorStore = await Chroma.fromDocuments(splits, embeddings, {
		collectionName: 'service-collection',
	});

	const ragChain = await createStuffDocumentsChain({
		llm: model,
		prompt: ChatPromptTemplate.fromMessages([
			['system', systemPrompt],
			new MessagesPlaceholder('chat_history'),
			['human', '{input}'],
		]),
		outputParser: new StringOutputParser(),
	});

	const ragChainImage = await createStuffDocumentsChain({
		llm: model,
		prompt: ChatPromptTemplate.fromMessages([
			['assistant', imageDetectionPrompt],
			['user', '{image_url}'],
			['user', '{input}'],
		]),
		outputParser: new StringOutputParser(),
	});

	const chain = await createRetrievalChain({
		retriever: vectorStore.asRetriever(3),
		combineDocsChain: ragChain,
	});

	const chainImage = await createRetrievalChain({
		retriever: vectorStore.asRetriever(3),
		combineDocsChain: ragChainImage,
	});

	// New
	const prompt = ChatPromptTemplate.fromMessages([
		[
			'system',
			// 'describe the image, carefully looks the related to home maintainer anything broken or not normal',
			'Assistant helps users with Describe image regarding home repair and maintenance services. The assistant can analyze images to identify issues such as leaks, structural problems, or other common household concerns. Be brief in your answers. Answer only in plain text, DO NOT use Markdown.',
		],
		new MessagesPlaceholder('message'),
	]);

	async function imageData(base64: string, input: string) {
		return await prompt.pipe(model).stream({
			message: new HumanMessage({
				content: [
					{
						type: 'image_url',
						image_url: base64,
					},
					{
						type: 'text',
						text: input,
					},
				],
			}),
		});
	}

	return {
		vectorStore,
		ragChain,
		ragChainImage,
		chain,
		chainImage,
		imageData,
	};
}
