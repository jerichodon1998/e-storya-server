import Fastify from 'fastify';
import { IUser } from '.';

declare module 'fastify' {
	export interface FastifyRequest {
		user: IUser;
	}
	export interface FastifyInstance {
		verifyJwtToken: (
			request: FastifyRequest,
			reply: FastifyReply
		) => Promise<void>;
	}
}
