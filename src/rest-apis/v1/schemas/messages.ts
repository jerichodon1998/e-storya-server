import { FastifySchema } from 'fastify';

export const getMessagesSchema: FastifySchema = {
	params: {
		type: 'object',
		required: ['channelId'],
		properties: {
			channelId: {
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
		},
	},
};
