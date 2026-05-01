import { getErrorMessage } from '@src/helpers';
import { messagesService } from '@src/lib';
import { IMessage } from '@src/shared/types';
import { FastifyReply, FastifyRequest } from 'fastify';
import mongoose from 'mongoose';

/**
 * Get messages controller.
 *
 * @param {FastifyRequest<{ Params: { channelId: string; }; }>} request
 * @param {FastifyReply} reply
 * @return {Promise<{ messages?: IMessage[] | null | undefined; error?: any; message?: string; pagination?: IPagination | undefined; }>}
 */
export async function getMessagesController(
	request: FastifyRequest<{
		Params: {
			conversationKey: string;
		};
		Querystring: {
			sizePerPage?: number;
			lastSeenMessageId?: string;
			lastSeenMessageCreatedAt?: string | Date;
		};
	}>,
	reply: FastifyReply
): Promise<{
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
		| undefined
	>;
	messages?: IMessage[] | null | undefined;
	error?: any;
	message?: string | undefined;
}> {
	const { conversationKey } = request.params;
	const {
		sizePerPage = 20,
		lastSeenMessageId,
		lastSeenMessageCreatedAt,
	} = request.query;
	const parsedLastSeenMessageCreatedAt = lastSeenMessageCreatedAt
		? new Date(lastSeenMessageCreatedAt)
		: undefined;

	const { error, messages } = await messagesService.getMessages({
		conversationKey,
		sizePerPage,
		lastSeenMessageId,
		lastSeenMessageCreatedAt: parsedLastSeenMessageCreatedAt,
	});

	if (error) {
		reply.status(500);
		return { error, message: getErrorMessage({ error }) };
	}

	return {
		messages,
		message: 'Success.',
	};
}
