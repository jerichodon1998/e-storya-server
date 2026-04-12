import { FastifySchema } from 'fastify';

export const userSignInSchema: FastifySchema = {
	body: {
		type: 'object',
		additionalProperties: false,
		properties: {
			email: {
				type: 'string',
				format: 'email',
			},
			password: {
				type: 'string',
			},
		},
		required: ['email', 'password'],
	},
};

export const userSignUpSchema: FastifySchema = {
	body: {
		type: 'object',
		additionalProperties: false,
		properties: {
			username: {
				type: 'string',
			},
			password: {
				type: 'string',
			},
			email: {
				type: 'string',
				format: 'email',
			},
		},
		required: ['username', 'password', 'email'],
	},
};
