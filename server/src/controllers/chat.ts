import { Request, Response } from 'express';
import catchAsyncError from '../shared/global/helpers/catch-async-error';

import { HumanMessage, AIMessage } from '@langchain/core/messages';
import {
	createJsonStream,
	initializeChains,
	loadAndProcessDocuments,
} from '../shared/services/langchain';
import { Readable } from 'stream';
let chat_history: any[] = [];
const data = [];
const chatController = {
	image: catchAsyncError(async (req: Request, res: Response) => {
		const {
			image,
			input = `Important: Don't use chat history. Find the issue any leakage, broken or anything related to home repair from the above image.\n5. After detecting an issue, ask the user if they would like to take services to address the problem. If the user says "yes," respond with the following message: "Great! Please fill out this form to proceed with your service request: YOUR_FORM_LINK_HERE".
`,
		} = req.body;
		try {
			if (!image && !input) {
				return res.status(400).json({ error: 'image and input are required' });
			}
			// console.log(image);
			const splits = await loadAndProcessDocuments();
			const { chainImage, imageData } = await initializeChains(splits);
			// data:image/png;base64,
			const responseStream = await imageData(image, input);
			// const responseStream = await chainImage.stream({
			// 	image_url: `${image}`,
			// 	input,
			// 	chat_history,
			// });

			const jsonStream = Readable.from(createJsonStream(responseStream));

			let answer = '';
			res.setHeader('Content-Type', 'application/json');
			res.setHeader('Transfer-Encoding', 'chunked');
			jsonStream.on('data', (data) => {
				answer += data.content;
				const jsonData = JSON.stringify(data) + '\n';
				res.write(jsonData);
			});
			jsonStream.on('end', () => {
				chat_history = chat_history.concat(new AIMessage(answer));
				res.end();
			});
		} catch (err) {
			console.log(err);
			res.status(500).json({ error: 'Internal Server Error' });
		}
	}),
	text: catchAsyncError(async (req: Request, res: Response) => {
		try {
			const { message } = req.body;
			console.log('chat_history.length', chat_history.length, chat_history, message);
			if (!message) {
				return res.status(400).json({ error: 'input is required' });
			}

			const splits = await loadAndProcessDocuments();
			const { chain } = await initializeChains(splits);

			const responseStream = await chain.stream({
				chat_history,
				input: message,
			});
			const jsonStream = Readable.from(createJsonStream(responseStream));

			chat_history = chat_history.concat(new HumanMessage(message));

			let answer = '';
			res.writeHead(200, {
				'Content-Type': 'application/json',
				'Transfer-Encoding': 'chunked',
			});

			// res.setHeader('Content-Type', 'application/x-ndjson');
			// res.setHeader('Transfer-Encoding', 'chunked');
			jsonStream.on('data', (data) => {
				answer += data.content;
				console.log(data);
				const jsonData = JSON.stringify(data);
				res.write(jsonData);
			});
			jsonStream.on('end', () => {
				chat_history = chat_history.concat(new AIMessage(answer));
				res.end();
			});
		} catch (err) {
			console.log(err);
			res.status(500).json({ error: 'Internal Server Error' });
		}
	}),
};

export default chatController;
