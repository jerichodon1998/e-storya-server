import { IMessage, Message } from '@/lib/db';
import { HydratedDocument } from 'mongoose';

class MessagesService {
	async insertMessages(params: { messages: IMessage[] }): Promise<{
		messages?: HydratedDocument<IMessage>[];
		error?: any;
	}> {
		const { messages } = params;

		try {
			const messageRes = await Message.insertMany(messages);

			return { messages: messageRes };
		} catch (error) {
			console.log('error', error);
			return { error };
		}
	}
}

const messagesService = new MessagesService();

export { messagesService };
