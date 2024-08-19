import { FileImage, SendHorizontal } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { buttonVariants } from '../ui/button';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
// import { Message, loggedInUserData } from '@/app/data';
import { Textarea } from '../ui/textarea';

interface ChatBottombarProps {
	sendMessage: (message: string) => void;
	sendImageMessage: (message: string) => Promise<void>;
	isMobile: boolean;
}

export const BottombarIcons = [{ icon: FileImage }];

export default function ChatBottombar({
	sendMessage,
	isMobile,
	sendImageMessage,
}: ChatBottombarProps) {
	const [message, setMessage] = useState('');
	const [imageBase64, setImageBase64] = useState<string>('');
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleIconClick = () => {
		// Trigger the file input when the icon is clicked
		if (fileInputRef.current) {
			fileInputRef.current.click();
		}
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				const base64Image = reader.result as string;
				// Handle the base64 image string (e.g., send it to the server or preview it)
				console.log(base64Image);
				setImageBase64(base64Image);
				setMessage(file.name);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		setMessage(event.target.value);
	};

	const handleSend = () => {
		if (imageBase64) {
			sendImageMessage(imageBase64);
			setMessage('');
			setImageBase64('')
			return;
		}
		if (message.trim()) {
			sendMessage(message.trim());
			setMessage('');

			if (inputRef.current) {
				inputRef.current.focus();
			}
		}
	};

	const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSend();
		}

		if (event.key === 'Enter' && event.shiftKey) {
			event.preventDefault();
			setMessage((prev) => prev + '\n');
		}
		if (imageBase64) {
			setImageBase64('');
			setMessage('');
		}
	};

	return (
		<div className="p-2 flex justify-between w-full items-center gap-2">
			<div className="flex">
				{!message.trim() && !isMobile && (
					<div className="flex">
						{BottombarIcons.map((icon, index) => (
							<button
								key={index}
								onClick={handleIconClick}
								className={cn(
									buttonVariants({ variant: 'ghost', size: 'icon' }),
									'h-9 w-9',
									'dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white'
								)}
							>
								<icon.icon size={20} className="text-muted-foreground" />
							</button>
						))}
					</div>
				)}
				{/* Hidden file input */}
				<input
					type="file"
					accept="image/*"
					ref={fileInputRef}
					style={{ display: 'none' }}
					onChange={handleFileChange}
				/>
			</div>

			<AnimatePresence initial={false}>
				<motion.div
					key="input"
					className="w-full relative"
					layout
					initial={{ opacity: 0, scale: 1 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 1 }}
					transition={{
						opacity: { duration: 0.05 },
						layout: {
							type: 'spring',
							bounce: 0.55,
						},
					}}
				>
					<Textarea
						autoComplete="off"
						value={message}
						ref={inputRef}
						onKeyDown={handleKeyPress}
						onChange={handleInputChange}
						name="message"
						placeholder="Aa"
						className=" w-full border rounded-full flex items-center h-9 resize-none overflow-hidden bg-background"
					></Textarea>
					<div className="absolute right-2 bottom-0.5  "></div>
				</motion.div>

				{message.trim() ? (
					<a
						href="#"
						className={cn(
							buttonVariants({ variant: 'ghost', size: 'icon' }),
							'h-9 w-9',
							'dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white shrink-0'
						)}
						onClick={handleSend}
					>
						<SendHorizontal size={20} className="text-muted-foreground" />
					</a>
				) : null}
			</AnimatePresence>
		</div>
	);
}
