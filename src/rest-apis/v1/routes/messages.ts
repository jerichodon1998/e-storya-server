import { FastifyInstance } from 'fastify';
import { verifyJwtToken } from '../middlewares';
import { getMessagesController } from '../controllers/messages';
import { getMessagesSchema } from '../schemas';

export default function MessagesRoutes(fastify: FastifyInstance) {
	fastify.decorate('verifyJwtToken', verifyJwtToken).after(() => {
		fastify.route({
			method: 'GET',
			url: '/:channelId',
			schema: getMessagesSchema,
			handler: getMessagesController,
			// preHandler: fastify.auth([fastify.verifyJwtToken]),
		});
	});
}
