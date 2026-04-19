import { websocketService } from '@src/lib/services/WebsocketService';
import { verifyJwtToken } from '@src/rest-apis/v1/middlewares';
import { FastifyInstance, FastifyRequest } from 'fastify';

export async function chatWebsocketRoutes(fastify: FastifyInstance) {
	fastify.get(
		'/ws',
		{ websocket: true },
		async (socket, request: FastifyRequest) => {
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

			await websocketService.registerSocket({
				userId: userId?.toString(),
				socket,
			});
		}
	);
}
