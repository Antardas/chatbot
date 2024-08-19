import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
type AsyncFunc = () => Promise<Response>;
export async function* streamingFetch(fetchcall: AsyncFunc) {
	const response = await fetchcall();
	// Attach Reader
	const reader = response?.body?.getReader();
	while (reader) {
		// wait for next encoded chunk
		const { done, value } = await reader.read();
		// check if stream is done
		if (done) break;
		// Decodes data chunk and yields it
		yield new TextDecoder().decode(value);
	}
}

export const AVATAR_IMAGE =
	'https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg';

export const BOT_IMAGE = 'https://cdn-icons-png.flaticon.com/512/2021/2021646.png';
