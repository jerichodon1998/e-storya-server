import { FastifyInstance } from 'fastify';
import { getMessagesController } from '@src/rest-apis/v1/controllers/messages';
import { getMessagesSchema } from '@src/rest-apis/v1/schemas/messages';

export default function MessagesRoutes(fastify: FastifyInstance) {
	fastify.route({
		method: 'GET',
		url: '/:conversationKey',
		schema: getMessagesSchema,
		handler: getMessagesController,
		preHandler: fastify.auth([fastify.verifyJwtToken]),
	});
}
