import { configDotenv } from "dotenv";

import FastifyWebSocket from "@fastify/websocket";
import Fastify from "fastify";
import cors from "@fastify/cors";

configDotenv();

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

fastify.register(async function (fastify) {
	fastify.get("/ws", { websocket: true }, async (socket, request: any) => {
		console.log("user", request?.user?.id);
		socket.on("message", (message) => {
			let parsedMessage = "";
			try {
				parsedMessage = message.toString();
				console.log("parsedMessage", parsedMessage);
			} catch (error) {
				console.log("error", error);
			}

			socket.send(parsedMessage);
		});

		socket.on("close", () => {
			console.log("user disconnected");
		});
	});
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
