import { FastifyInstance } from 'fastify';
import {
	searchUsersSchema,
	userSignInSchema,
	userSignUpSchema,
} from '@rest-apis/v1/schemas';
import {
	userSignInController,
	userSignUpController,
	getSignedInUserController,
	searchUsersController,
} from '@rest-apis/v1/controllers';

export async function userRoutes(fastify: FastifyInstance) {
	fastify.route({
		method: 'POST',
		url: '/signin',
		schema: userSignInSchema,
		handler: userSignInController,
	});

	fastify.route({
		method: 'POST',
		url: '/signup',
		schema: userSignUpSchema,
		handler: userSignUpController,
	});

	fastify.route({
		method: 'GET',
		url: '/signed-in-user',
		preHandler: fastify.auth([fastify.verifyJwtToken]),
		handler: getSignedInUserController,
	});

	fastify.route({
		method: 'GET',
		url: '/search',
		preHandler: fastify.auth([fastify.verifyJwtToken]),
		schema: searchUsersSchema,
		handler: searchUsersController,
	});
}
