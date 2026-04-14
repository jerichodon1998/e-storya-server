import 'dotenv/config';

import { mongooseInit } from './lib';
import { chatWebsocketRoutes } from '@src/websockets/v1/chat';
import { verifyJwtToken } from './rest-apis/v1/middlewares';
import { AppRoutes } from './rest-apis/v1/routes';

import cors from '@fastify/cors';
import FastifyWebSocket from '@fastify/websocket';
import Fastify from 'fastify';
import FastifyHelmet from '@fastify/helmet';
import FastifyCookie from '@fastify/cookie';
import FastifyAuth from '@fastify/auth';

const fastify = Fastify({
	logger: {
		level: 'warn',
	},
});

fastify.register(FastifyAuth);
fastify.register(FastifyCookie, {
	secret: process.env.COOKIE_SIGNATURE,
	hook: 'onRequest',
});
fastify.register(FastifyHelmet);
fastify.register(FastifyWebSocket, {
	errorHandler(error, socket, request, reply) {
		socket.close();
	},
	options: {
		maxPayload: 1048576 * 10, // 10 MB
	},
});
fastify.register(cors, {
	origin: (origin, cb) => {
		cb(null, true);
		return;
	},
	credentials: true,
});
fastify.decorate('verifyJwtToken', verifyJwtToken);
fastify.register(AppRoutes, { prefix: '/v1' });
fastify.register(chatWebsocketRoutes, { prefix: '/v1' });

fastify.get('/', (request, reply) => {
	reply.status(200).send({ hello: 'world' });
});

async function start() {
	try {
		await mongooseInit();
		const fastifyServer = await fastify.listen({ port: process.env.PORT });
		console.log(`server listening on ${fastifyServer}`);
	} catch (error) {
		console.log('start() error', error);
	}
}

start();
