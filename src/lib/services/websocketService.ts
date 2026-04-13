import { messagesService } from '@lib/services/MessagesService';
import { WebSocket } from 'ws';
import { IMessage } from '@lib/db';
import { MessageTypeEnum } from '@/shared/enums';

class WebSocketService {
	clients: Map<string, Set<WebSocket>> = new Map();

	private logClients() {
		console.log(
			'================================================================================'
		);
		if (!this.clients.size) {
			console.log('no clients');
		} else {
			console.log('total connected clients:', this.clients.size);
			for (const [clientId, sockets] of this.clients) {
				console.log(
					'userId: ',
					clientId,
					'| total connected sockets:',
					sockets.size
				);
			}
		}
		console.log(
			'================================================================================'
		);
	}

	// TODO: implement ping pong to check if client is still connected.
	registerSocket(params: { clientId: string; socket: WebSocket }) {
		const { socket, clientId } = params;

		if (!this.clients.has(clientId)) {
			this.clients.set(params.clientId, new Set());
		}

		this.clients.get(clientId)?.add(socket);
		this.logClients();

		socket.on('message', (message: Buffer | ArrayBuffer | Buffer[]) => {
			try {
				const parsedMessage = JSON.parse(message?.toString()) as IMessage;
				console.log('parsedMessage', parsedMessage);
				this.broadcast({ message: parsedMessage });
			} catch (error: any) {
				console.log('error', error?.message);
			}
		});

		socket.on('close', () => {
			console.log('client disconnected');

			this.clients.get(clientId)?.delete(socket);

			if (!this.clients.get(clientId)?.size) {
				this.clients.delete(clientId);
			}

			this.logClients();
		});
	}

	async broadcast(params: { message: string | Record<string, any> }) {
		const parsedMessage: IMessage =
			typeof params.message === 'string'
				? JSON.parse(params.message)
				: params.message;
		const stringifiedMessage =
			typeof params.message === 'string'
				? params.message
				: JSON.stringify(params.message);

		try {
			await messagesService.insertMessages({
				messages: [
					{
						...parsedMessage,
						type: MessageTypeEnum.TEXT,
					},
				],
				shouldThrowError: true,
			});

			for (const [_, sockets] of this.clients) {
				for (const socket of sockets.values()) {
					if (socket.readyState === WebSocket.OPEN) {
						console.log('broadcasting', stringifiedMessage);
						socket.send(stringifiedMessage);
					}
				}
			}
		} catch (error) {
			console.log('error', error);
		}
	}
}

const websocketService = new WebSocketService();

export { websocketService };
