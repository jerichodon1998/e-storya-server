import 'dotenv/config';

import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import { WebSocket } from 'ws';
import { allowedOrigins, mongooseInit } from './lib';
import { Message, SignUpMethodEnum, User } from './lib/db';

import cors from '@fastify/cors';
import mongoose from 'mongoose';
import FastifyWebSocket from '@fastify/websocket';

const clients: Map<string, WebSocket> = new Map();

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
		const userCredentials = await User.signinWithEmailAndPassword({
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
			const { error, user } = await User.createNewUser({
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

async function broadcast(params: { message: string | Record<string, any> }) {
	const parsedMessage =
		typeof params.message === 'string'
			? JSON.parse(params.message)
			: params.message;
	const stringifiedMessage =
		typeof params.message === 'string'
			? params.message
			: JSON.stringify(params.message);

	try {
		await Message.insertOne({
			...parsedMessage,
			userId: new mongoose.Types.ObjectId(),
			type: 'string',
			others: '',
		});

		for (const [_, socket] of clients) {
			if (socket.readyState === WebSocket.OPEN) {
				console.log('broadcasting', stringifiedMessage);
				socket.send(stringifiedMessage);
			}
		}
	} catch (error) {
		console.log('error', error);
	}
}

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

			clients.set(userId, socket);
			console.log('clients', clients.keys());

			socket.on('message', (message: Buffer | ArrayBuffer | Buffer[]) => {
				let parsedMessage = '';

				try {
					parsedMessage = JSON.parse(message?.toString());
					console.log('parsedMessage', parsedMessage);
				} catch (error) {
					console.log('error', error);
				}

				broadcast({ message: JSON.stringify(parsedMessage) });
			});

			socket.on('close', () => {
				console.log('user disconnected');
				clients.delete(userId);
				console.log('clients', clients.keys());
			});
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
