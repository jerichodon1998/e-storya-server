import { IUser } from '@/lib';
import Fastify from 'fastify';

declare module 'fastify' {
	export interface FastifyRequest {
		user: IUser | null;
	}
	export interface FastifyInstance {
		verifyJwtToken: (
			request: FastifyRequest,
			reply: FastifyReply
		) => Promise<void>;
	}
}
