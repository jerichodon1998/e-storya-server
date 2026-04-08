import { FastifyInstance } from 'fastify';
import {
	userSignInSchema,
	userSignUpSchema,
} from '@rest-apis/v1/users/schemas';
import {
	userSignInController,
	userSignUpController,
} from '@rest-apis/v1/users/controllers';

export async function userRoutes(fastify: FastifyInstance) {
	fastify.route({
		method: 'POST',
		url: '/users/signin',
		schema: userSignInSchema,
		handler: userSignInController,
	});

	fastify.route({
		method: 'POST',
		url: '/users/signup',
		schema: userSignUpSchema,
		handler: userSignUpController,
	});
}
