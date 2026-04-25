import { FastifyInstance } from 'fastify';
import { userRoutes } from './users';
import { channelRoutes } from './channels';
import MessagesRoutes from './messages';

export async function AppRoutes(fastify: FastifyInstance) {
	fastify.register(userRoutes, { prefix: '/users' });
	fastify.register(channelRoutes, { prefix: '/channels' });
	fastify.register(MessagesRoutes, { prefix: '/messages' });
}
