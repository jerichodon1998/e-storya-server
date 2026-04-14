import { Message } from '@src/lib/db';
import { IMessage } from '@src/shared/types';
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
