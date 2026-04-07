import 'dotenv/config';

import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import {
	allowedOrigins,
	mongooseInit,
	SignUpMethodEnum,
	usersService,
} from '@/lib';

import cors from '@fastify/cors';
import FastifyWebSocket from '@fastify/websocket';
import { websocketService } from './lib/services/websocketService';

const fastify = Fastify({
	logger: {
		level: 'warn',
	},
});

fastify.register(FastifyWebSocket);
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

fastify.post(
	'/users/signin',
	async (
		request: FastifyRequest<{
			Body: {
				email: string;
				password: string;
			};
		}>,
		reply: FastifyReply
	) => {
		const { email, password } = request.body;
		const userCredentials = await usersService.signinWithEmailAndPassword({
			email: email,
			password: password,
		});

		if (!userCredentials.user) {
			reply.status(401).send({ error: userCredentials.error });
		}

		reply.status(200).send(userCredentials.user);
	}
);

fastify.post(
	'/users/signup',
	async (
		request: FastifyRequest<{
			Body: {
				username: string;
				password: string;
				email: string;
			};
		}>,
		reply: FastifyReply
	) => {
		const { username, password, email } = request.body;

		try {
			const { error, user } = await usersService.createNewUser({
				username,
				password,
				email,
				method: SignUpMethodEnum.EMAIL,
			});

			if (!user || error) {
				reply.status(500).send({ error });
				return;
			}

			reply.status(200).send(user);
		} catch (error) {
			console.log('error', error);
			reply.status(500).send({ error });
		}
	}
);

fastify.register(async function (fastify) {
	fastify.get(
		'/ws',
		{ websocket: true },
		async (
			socket,
			request: FastifyRequest<{
				Querystring: {
					userId: string;
				};
			}>
		) => {
			const userId = request?.query?.userId;

			if (!userId) {
				socket.close(1000, 'No userId provided');
				return;
			}

			websocketService.registerSocket({ clientId: userId, socket });
		}
	);
});

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
