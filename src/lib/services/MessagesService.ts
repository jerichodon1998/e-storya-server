import { Message } from '@src/lib/db';
import { IMessage } from '@src/shared/types';
import mongoose, { HydratedDocument } from 'mongoose';

class MessagesService {
	/**
	 * Insert messages.
	 *
	 * @param {IMessage[]} params.messages
	 * @param {boolean} params.shouldThrowError=false
	 * @param {mongoose.mongo.ClientSession} params.session
	 * @return {Promise<{ messages?: HydratedDocument<IMessage>[]; error?: any; }>}
	 */
	async insertMessages(params: {
		messages: IMessage[];
		shouldThrowError?: boolean;
		session?: mongoose.mongo.ClientSession;
	}): Promise<{
		messages?: HydratedDocument<IMessage>[];
		error?: any;
	}> {
		const { messages, shouldThrowError = false, session = undefined } = params;

		try {
			const messageRes = await Message.insertMany(messages, {
				...(session && { session }),
			});

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
