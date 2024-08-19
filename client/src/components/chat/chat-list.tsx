import { cn } from '@/lib/utils';
import React, { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarImage } from '../ui/avatar';
import ChatBottombar from './chat-bottombar';
import { AnimatePresence, motion } from 'framer-motion';
import { Message } from '@/types';

interface ChatListProps {
	messages: Message[];
	sendMessage: (message: string) => void;
	sendImageMessage: (message: string) => Promise<void>;
	isMobile: boolean;
}

export function ChatList({ messages, isMobile, sendMessage, sendImageMessage }: ChatListProps) {
	const messagesContainerRef = useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		if (messagesContainerRef.current) {
			messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
		}
	}, [messages]);

	return (
		<div className="w-full  overflow-x-hidden h-full flex flex-col">
			<div
				ref={messagesContainerRef}
				className="w-full overflow-y-auto overflow-x-hidden h-full flex flex-col"
			>
				<AnimatePresence>
					{messages.map((message, index) => (
						<motion.div
							key={index}
							layout
							initial={{ opacity: 0, scale: 1, y: 50, x: 0 }}
							animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
							exit={{ opacity: 0, scale: 1, y: 1, x: 0 }}
							transition={{
								opacity: { duration: 0.1 },
								layout: {
									type: 'spring',
									bounce: 0.3,
									duration: messages.indexOf(message) * 0.05 + 0.2,
								},
							}}
							style={{
								originX: 0.5,
								originY: 0.5,
							}}
							className={cn(
								'flex flex-col gap-2 p-4 whitespace-pre-wrap',
								message.role !== 'assistant' ? 'items-end' : 'items-start'
							)}
						>
							<div className="flex gap-3 items-center">
								{message.role === 'assistant' && (
									<Avatar className="flex justify-center items-center">
										<AvatarImage
											src={message.avatar}
											alt={message.role}
											width={6}
											height={6}
										/>
									</Avatar>
								)}

								<MessageBody
									message={message.message}
									image={message.image ?? ''}
								/>

								{message.role !== 'assistant' && (
									<Avatar className="flex justify-center items-center">
										<AvatarImage
											src={message.avatar}
											alt={message.role}
											width={6}
											height={6}
										/>
									</Avatar>
								)}
							</div>
						</motion.div>
					))}
				</AnimatePresence>
			</div>
			<ChatBottombar
				sendMessage={sendMessage}
				sendImageMessage={sendImageMessage}
				isMobile={isMobile}
			/>
		</div>
	);
}

const MessageBody = ({ message, image }: BodyProps) => {
	const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
	const [updateMessage, setUpdatedMessage] = useState('');
	useEffect(() => {
		const question: string[] = [];
		const text = message.replaceAll('*', '')
			.replaceAll(/<<([^>]+)>>/g, (_match, content: string) => {
				question.push(content);
				return '';
			})
			.split('<<')[0] // Truncate incomplete questions
			.trim();
		setUpdatedMessage(text);
		setFollowUpQuestions(question);
		console.log(followUpQuestions);
	}, [message]);
	return (
		<div className="bg-accent p-3 rounded-md max-w-xs">
			{image ? <img src={image} /> : <span className="">{updateMessage}</span>}
			<div className="flex flex-col">
				{followUpQuestions.map((question, index) => (
					<span key={index} className="border px-1 py-2 rounded  mb-2 border-blue-300">
						{question}
					</span>
				))}
			</div>
		</div>
	);
};

interface BodyProps {
	message: string;
	image: string;
}
