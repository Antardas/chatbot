import ChatTopbar from './chat-topbar';
import { ChatList } from './chat-list';
import { useEffect, useRef, useState } from 'react';

import { AVATAR_IMAGE, BOT_IMAGE } from '@/lib/utils';
import { Message } from '@/types';
interface ChatProps {
	messages?: Message[];
	isMobile: boolean;
}

export function Chat({ isMobile }: ChatProps) {
	const [messages, setMessages] = useState<Array<Message>>([]);
	const [_newMessage, setNewMessage] = useState<string>('');
	const isRender = useRef<boolean>(false);

	// const sendMessage = async (message: string) => {
	// 	try {
	// 		const userMessage: Message = {
	// 			role: 'user',
	// 			avatar: AVATAR_IMAGE,
	// 			message: message,
	// 		};
	// 		setMessages((prevMessages) => [...prevMessages, userMessage]);
	// 		// getting response from server based on the user prompt
	// 		const response = await fetch('http://localhost:5002/chat/text', {
	// 			method: 'post',
	// 			headers: {
	// 				Accept: 'application/json',
	// 				'Content-Type': 'application/json',
	// 			},
	// 			body: JSON.stringify({ message: message }),
	// 		});
	// 		setNewMessage('typing...');
	// 		const botMessage: Message = {
	// 			role: 'assistant',
	// 			avatar: AVATAR_IMAGE,
	// 			message: 'typing...',
	// 		};
	// 		setMessages((prevMessages) => [...prevMessages, botMessage]);

	// 		if (!response.ok || !response.body) {
	// 			throw response.statusText;
	// 		}

	// 		// Here we start prepping for the streaming response
	// 		const reader = response.body.getReader();
	// 		const decoder = new TextDecoder();
	// 		const loopRunner = true;

	// 		while (loopRunner) {
	// 			// Here we start reading the stream, until its done.
	// 			const { value, done } = await reader.read();
	// 			if (done) {
	// 				break;
	// 			}
	// 			const decodedChunk = decoder.decode(value, { stream: true });
	// 			const data = JSON.parse(decodedChunk);
	// 			setMessages((prevMessages) => {
	// 				const updatedMessages = [...prevMessages];
	// 				// Access the last message in the cloned array
	// 				const lastMessage = updatedMessages.pop();

	// 				if (lastMessage) {
	// 					if (lastMessage.message === 'typing...') {
	// 						lastMessage.message = data.content;
	// 					} else {
	// 						lastMessage.message += data.content;
	// 					}

	// 					updatedMessages.push(lastMessage);
	// 				}

	// 				return updatedMessages;
	// 			});
	// 			setNewMessage((prev) => prev + data.message);
	// 		}
	// 	} catch (error) {
	// 		console.error('Error fetching data:', error);
	// 	}
	// };

	const updateMessages = (prevMessages: Message[], content: string): Message[] => {
		const updatedMessages = [...prevMessages];
		const lastMessage = updatedMessages.pop();

		if (lastMessage) {
			if (
				lastMessage.message === 'typing...' ||
				lastMessage.message === 'processing image...'
			) {
				// For images, set the content directly as a base64 string or URL
				lastMessage.message = content;
			} else {
				// Append text content, or update image URL
				lastMessage.message += content;
			}

			updatedMessages.push(lastMessage);
		}

		return updatedMessages;
	};

	const sendMessage = async (message: string) => {
		try {
			const userMessage: Message = {
				role: 'user',
				avatar: AVATAR_IMAGE,
				message: message,
			};
			setMessages((prevMessages) => [...prevMessages, userMessage]);

			const response = await fetch('http://localhost:5002/chat/text', {
				method: 'post',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ message: message }),
			});

			setNewMessage('typing...');
			const botMessage: Message = {
				role: 'assistant',
				avatar: AVATAR_IMAGE,
				message: 'typing...',
			};
			setMessages((prevMessages) => [...prevMessages, botMessage]);

			if (!response.ok || !response.body) {
				throw response.statusText;
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();

			while (true) {
				const { value, done } = await reader.read();
				if (done) {
					break;
				}
				const decodedChunk = decoder.decode(value, { stream: true });
				const data = JSON.parse(decodedChunk);

				setMessages((prevMessages) => updateMessages(prevMessages, data.content));
				setNewMessage((prev) => prev + data.message);
			}
		} catch (error) {
			console.error('Error fetching data:', error);
		}
	};

	const sendImageMessage = async (base64Image: string) => {
		try {
			const userMessage: Message = {
				role: 'user',
				avatar: AVATAR_IMAGE,
				message: '',
				image: base64Image,
			};
			setMessages((prevMessages) => [...prevMessages, userMessage]);
			const botMessage: Message = {
				role: 'assistant',
				avatar: BOT_IMAGE,
				message: 'processing image...',
			};
			setMessages((prevMessages) => [...prevMessages, botMessage]);
			// Simulate sending image to the server and getting a response
			const response = await fetch('http://localhost:5002/chat/image', {
				method: 'post',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ image: base64Image }),
			});

			if (!response.ok || !response.body) {
				throw response.statusText;
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();

			while (true) {
				const { value, done } = await reader.read();
				if (done) {
					break;
				}
				const decodedChunk = decoder.decode(value, { stream: true });
				const data = JSON.parse(decodedChunk);

				// Use the utility function to update the messages
				setMessages((prevMessages) => updateMessages(prevMessages, data.content));
			}
		} catch (error) {
			console.error('Error fetching data:', error);
		}
	};

	useEffect(() => {
		if (!isRender.current) {
			const botMessage: Message = {
				role: 'assistant',
				avatar: BOT_IMAGE,
				message: 'I am your home maintenance assistant. How may I help you?.',
			};
			setMessages((prevMessages) => [...prevMessages, botMessage]);
			isRender.current = true;
		}
	}, []);

	return (
		<div className="flex flex-col justify-between w-full h-[80vh]">
			<ChatTopbar />

			<ChatList
				messages={messages}
				sendMessage={sendMessage}
				sendImageMessage={sendImageMessage}
				isMobile={isMobile}
			/>
		</div>
	);
}
