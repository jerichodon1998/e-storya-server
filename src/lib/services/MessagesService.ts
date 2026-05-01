import { getErrorMessage, validateDirectMessageUniqueKey } from '@src/helpers';
import { Message } from '@src/lib/db';
import { IMessage } from '@src/shared/types';
import mongoose, {
	HydratedDocument,
	isValidObjectId,
	ObjectId,
} from 'mongoose';

class MessagesService {
	/**
	 * Insert messages.
	 *
	 * @param {IMessage[]} params.messages
	 * @param {boolean } params.shouldThrowError = false
	 * @param {mongoose.mongo.ClientSession} params.session
	 * @param {boolean} params.enableLean = false
	 * @return {Promise<{ messages?: (HydratedDocument<IMessage>|IMessage)[]; error?: any; message?: string; }>}
	 */
	async insertMessages(params: {
		messages: Partial<IMessage>[];
		shouldThrowError?: boolean;
		session?: mongoose.mongo.ClientSession;
		enableLean?: boolean;
	}): Promise<{
		messages?: (HydratedDocument<IMessage> | IMessage)[];
		error?: any;
		message?: string;
	}> {
		const {
			messages,
			shouldThrowError = false,
			session = undefined,
			enableLean = false,
		} = params;

		try {
			const messageRes = await Message.insertMany(messages, {
				...(session && { session }),
				lean: enableLean,
			});

			return { messages: messageRes };
		} catch (error) {
			if (shouldThrowError) {
				throw error;
			}

			return { error, message: getErrorMessage({ error }) };
		}
	}

	/**
	 * Get messages.
	 * - this is a cursor based query.
	 * @param {string | ObjectId} params.channelId
	 * @param {string | ObjectId} params.lastMessageIdSeen
	 * @param {number} params.sizePerPage - default 20
	 * @return {Promise<{ messages?: IMessage[] | null | undefined; error?: any; message?: string; }>}
	 */
	async getMessages(params: {
		conversationKey: string | ObjectId;
		lastSeenMessageId?: string | ObjectId | undefined | null;
		lastSeenMessageCreatedAt?: Date | undefined | null;
		sizePerPage?: number;
		shouldThrowError?: boolean;
	}): Promise<{
		messages?: IMessage[];
		error?: any;
		message: string;
	}> {
		const {
			conversationKey,
			lastSeenMessageId = undefined,
			lastSeenMessageCreatedAt = undefined,
			sizePerPage = 20,
			shouldThrowError = false,
		} = params;
		const isChannelId = isValidObjectId(conversationKey);
		const isDirectMessageUniqueKey = validateDirectMessageUniqueKey(
			conversationKey?.toString()
		);

		if (!isChannelId && !isDirectMessageUniqueKey) {
			if (shouldThrowError) {
				throw new Error('Invalid conversationKey');
			}

			return {
				error: 'Invalid conversationKey',
				message: 'Invalid conversationKey.',
			};
		}

		try {
			const messages = await Message.find(
				{
					...(isChannelId && { channelId: conversationKey }),
					...(isDirectMessageUniqueKey && {
						directMessageUniqueKey: conversationKey,
					}),
					deletedAt: null,
					...(lastSeenMessageId &&
						lastSeenMessageCreatedAt && {
							$or: [
								{ createdAt: { $lt: lastSeenMessageCreatedAt } },
								{
									createdAt: lastSeenMessageCreatedAt,
									_id: { $lt: lastSeenMessageId },
								},
							],
						}),
				},
				null,
				{ lean: true }
			)
				.sort({ createdAt: -1, _id: -1 })
				.limit(sizePerPage);

			return { message: 'Success.', messages };
		} catch (error) {
			return { error, message: getErrorMessage({ error }) };
		}
	}
}

const messagesService = new MessagesService();

export { messagesService };
