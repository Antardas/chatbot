
import { Avatar, AvatarImage } from '../ui/avatar';
import { Info, Phone, Video } from 'lucide-react';

export const TopbarIcons = [{ icon: Phone }, { icon: Video }, { icon: Info }];

export default function ChatTopbar() {
	return (
		<div className="w-full h-20 flex p-4 justify-between items-center border-b">
			<div className="flex items-center gap-2">
				<Avatar className="flex justify-center items-center">
					<AvatarImage
						src={'https://cdn-icons-png.flaticon.com/512/2021/2021646.png'}
						alt={'robot'}
						width={6}
						height={6}
						className="w-10 h-10 "
					/>
				</Avatar>
				<div className="flex flex-col">
					<span className="font-medium">Home Maintenance Assistant</span>
				</div>
			</div>
		</div>
	);
}
