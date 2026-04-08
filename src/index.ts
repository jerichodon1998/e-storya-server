import 'dotenv/config';

import { allowedOrigins, mongooseInit } from '@/lib';
import { AppRoutes } from '@/rest-apis/v1/users/routes';
import { chatWebsocketRoutes } from '@/websockets/v1/chat';

import cors from '@fastify/cors';
import FastifyWebSocket from '@fastify/websocket';
import Fastify from 'fastify';

const fastify = Fastify({
	logger: {
		level: 'warn',
	},
});

fastify.register(FastifyWebSocket, {
	options: {
		maxPayload: 1048576 * 10, // 10 MB
	},
});
fastify.register(cors, {
	origin: (origin, cb) => {
		if (
			!allowedOrigins.includes(origin || '') &&
			(process.env.ENV === 'production' || process.env.ENV === 'staging')
			// maybe we should add the https check?
		) {
			cb(new Error('Not allowed'), false);
		}

		cb(null, true);
		return;
	},
});

fastify.register(AppRoutes, { prefix: '/v1' });
fastify.register(chatWebsocketRoutes, { prefix: '/v1' });

fastify.get('/', (request, reply) => {
	reply.status(200).send({ hello: 'world' });
});

async function start() {
	try {
		await mongooseInit();
		const fastifyServer = await fastify.listen({ port: 3001 });
		console.log(`server listening on ${fastifyServer}`);
	} catch (error) {
		console.log('start() error', error);
	}
}

start();
