import { FastifySchema } from 'fastify';

export const getMessagesSchema: FastifySchema = {
	params: {
		type: 'object',
		required: ['conversationKey'],
		properties: {
			conversationKey: {
				type: 'string',
			},
		},
	},
	querystring: {
		type: 'object',
		properties: {
			sizePerPage: {
				type: 'number',
			},
			lastSeenMessageId: {
				type: 'string',
			},
			lastSeenMessageCreatedAt: {
				type: 'string',
			},
		},
	},
};
