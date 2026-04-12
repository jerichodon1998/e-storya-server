import { websocketService } from '@/lib/services/websocketService';
import { verifyJwtToken } from '@/rest-apis/v1/middlewares';
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
			try {
				await verifyJwtToken(request);
			} catch (error) {
				socket.close();
				return;
			}

			const user = request.user;
			const userId = user?._id;

			if (!userId) {
				socket.close();
				return;
			}

			websocketService.registerSocket({ clientId: userId?.toString(), socket });
		}
	);
}
