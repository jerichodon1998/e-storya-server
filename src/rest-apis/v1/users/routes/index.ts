import { FastifyInstance } from 'fastify';
import { userRoutes } from './users';

export async function AppRoutes(fastify: FastifyInstance) {
	fastify.register(userRoutes, { prefix: '/users' });
}
