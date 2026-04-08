import { websocketService } from '@/lib/services/websocketService';
import { FastifyInstance, FastifyRequest } from 'fastify';

export async function chatWebsocketRoutes(fastify: FastifyInstance) {
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
}
