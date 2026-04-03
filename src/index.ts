import { configDotenv } from "dotenv";

import FastifyWebSocket from "@fastify/websocket";
import Fastify, { FastifyRequest } from "fastify";
import { WebSocket } from "ws";
import cors from "@fastify/cors";

configDotenv();

const clients: Map<string, WebSocket> = new Map();

const fastify = Fastify({
	logger: {
		level: "warn",
	},
});
fastify.register(FastifyWebSocket);
fastify.register(cors, {
	origin: (origin, cb) => {
		if (
			process.env.ENV === "development" ||
			(process.env.ENV !== "production" && process.env.ENV !== "staging")
		) {
			cb(null, true);
			return;
		}

		cb(new Error("Not allowed"), false);
	},
});

function broadcast(params: { message: string }) {
	for (const [_, socket] of clients) {
		if (socket.readyState === WebSocket.OPEN) {
			console.log("broadcasting", params.message);
			socket.send(params.message);
		}
	}
}

fastify.register(async function (fastify) {
	fastify.get(
		"/ws",
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
				socket.close(1000, "No userId provided");
				return;
			}

			clients.set(userId, socket);
			console.log("clients", clients.keys());

			socket.on("message", (message: Buffer | ArrayBuffer | Buffer[]) => {
				let parsedMessage = "";

				try {
					parsedMessage = JSON.parse(message?.toString());
					console.log("parsedMessage", parsedMessage);
				} catch (error) {
					console.log("error", error);
				}

				broadcast({ message: JSON.stringify(parsedMessage) });
			});

			socket.on("close", () => {
				console.log("user disconnected");
				clients.delete(userId);
				console.log("clients", clients.keys());
			});
		}
	);
});

fastify.get("/", (request, reply) => {
	reply.status(200).send({ hello: "world" });
});

fastify.listen({ port: 3001 }, (err, address) => {
	if (err) {
		console.error(err);
		process.exit(1);
	}

	console.log(`Server listening at ${address}`);
});
