export interface Message {
	role: 'user' | 'assistant';
	message: string;
	avatar: string;
	image?: string;
}
