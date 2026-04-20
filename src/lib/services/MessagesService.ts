import { getErrorMessage } from '@src/helpers';
import { Message } from '@src/lib/db';
import { IMessage } from '@src/shared/types';
import mongoose, { HydratedDocument, ObjectId } from 'mongoose';

class MessagesService {
	/**
	 * Insert messages.
	 *
	 * @param {IMessage[]} params.messages
	 * @param {boolean } params.shouldThrowError = false
	 * @param {mongoose.mongo.ClientSession} params.session
	 * @param {boolean} params.enableLean = true
	 * @return {Promise<{ messages?: (HydratedDocument<IMessage>|IMessage)[]; error?: any; message?: string; }>}
	 */
	async insertMessages(params: {
		messages: IMessage[];
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
			enableLean = true,
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
	 * Get messages Cursor.
	 * - this is a cursor based query.
	 * @param {string | ObjectId} params.channelId
	 * @param {number} params.batchSize - default 20
	 * @return {Promise<{ cursor?: mongoose.Cursor<IMessage & Required<{ _id: string | mongoose.Schema.Types.ObjectId; }>> | null; error?: any; message?: string; }>}
	 */
	getMessagesCursor(params: {
		channelId: string | ObjectId;
		batchSize?: number;
	}): {
		/**
		 * TODO: Improve this type annotation in the future, I just copy pasted this when I hovered the `const cursor` HAHA!
		 * PS: I'm not sure if this is the best way to do this, but I don't know how to do it better.
		 */
		cursor?: mongoose.Cursor<
			IMessage &
				Required<{
					_id: string | mongoose.Schema.Types.ObjectId;
				}> & {
					__v: number;
				},
			mongoose.QueryOptions<IMessage>,
			| (IMessage &
					Required<{
						_id: string | mongoose.Schema.Types.ObjectId;
					}> & {
						__v: number;
					})
			| null
		>;
		error?: any;
		message?: string;
	} {
		const { channelId, batchSize = 20 } = params;

		try {
			/**
			 * NOTE: Should explicity close the cursor when done.
			 */
			const cursor = Message.find(
				{
					channelId,
					deletedAt: null,
				},
				null,
				{
					lean: true,
				}
			)
				.sort({ createdAt: -1, _id: -1 })
				.batchSize(batchSize)
				.cursor();

			return { cursor, message: 'Success.' };
		} catch (error) {
			return { error, message: getErrorMessage({ error }) };
		}
	}
}

const messagesService = new MessagesService();

export { messagesService };
