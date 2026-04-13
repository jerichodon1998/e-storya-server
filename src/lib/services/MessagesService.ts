import { IMessage, Message } from '@/lib/db';
import { HydratedDocument } from 'mongoose';

class MessagesService {
	async insertMessages(params: {
		messages: IMessage[];
		shouldThrowError?: boolean;
	}): Promise<{
		messages?: HydratedDocument<IMessage>[];
		error?: any;
	}> {
		const { messages, shouldThrowError } = params;

		try {
			const messageRes = await Message.insertMany(messages);

			return { messages: messageRes };
		} catch (error) {
			if (shouldThrowError) {
				throw error;
			}

			console.log('error', error);
			return { error };
		}
	}
}

const messagesService = new MessagesService();

export { messagesService };
