import { FastifyInstance } from 'fastify';
import { userRoutes } from './users';
import { channelRoutes } from './channels';

export async function AppRoutes(fastify: FastifyInstance) {
	fastify.register(userRoutes, { prefix: '/users' });
	fastify.register(channelRoutes, { prefix: '/channels' });
}
