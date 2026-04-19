import { FastifyInstance } from 'fastify';
import { verifyJwtToken } from '@rest-apis/v1/middlewares';
import {
	createChannelController,
	getChannelController,
	getUserChannelsController,
	updateChannelController,
	getChannelMembersController,
} from '@rest-apis/v1/controllers';
import {
	createChannelSchema,
	getChannelMembersSchema,
	getChannelSchema,
	getUserChannelsSchema,
	updateChannelSchema,
} from '@rest-apis/v1/schemas';

export async function channelRoutes(fastify: FastifyInstance) {
	fastify.decorate('verifyJwtToken', verifyJwtToken).after(() => {
		fastify.route({
			url: '/',
			handler: getUserChannelsController,
			schema: getUserChannelsSchema,
			preHandler: fastify.auth([fastify.verifyJwtToken]),
			method: 'GET',
		});

		fastify.route({
			method: 'GET',
			url: '/:channelId',
			handler: getChannelController,
			schema: getChannelSchema,
			preHandler: fastify.auth([fastify.verifyJwtToken]),
		});

		fastify.route({
			method: 'POST',
			url: '/',
			handler: createChannelController,
			schema: createChannelSchema,
			preHandler: fastify.auth([fastify.verifyJwtToken]),
		});

		fastify.route({
			method: 'PATCH',
			url: '/:channelId',
			handler: updateChannelController,
			schema: updateChannelSchema,
			preHandler: fastify.auth([fastify.verifyJwtToken]),
		});

		fastify.route({
			method: 'GET',
			url: '/:channelId/members',
			handler: getChannelMembersController,
			schema: getChannelMembersSchema,
			preHandler: fastify.auth([fastify.verifyJwtToken]),
		});
	});
}
