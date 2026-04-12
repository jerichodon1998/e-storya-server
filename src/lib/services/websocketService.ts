import { messagesService } from './MessagesService';
import { IMessage, MessageTypeEnum } from '../types';
import { WebSocket } from 'ws';

class WebSocketService {
	clients: Map<string, Set<WebSocket>> = new Map();

	registerSocket(params: { clientId: string; socket: WebSocket }) {
		const { socket, clientId } = params;

		if (!this.clients.has(clientId)) {
			this.clients.set(params.clientId, new Set());
		}

		this.clients.get(clientId)?.add(socket);

		for (const [_, sockets] of this.clients) {
			console.log('clientId', _, 'sockets', sockets.size);
		}

		socket.on('message', (message: Buffer | ArrayBuffer | Buffer[]) => {
			let parsedMessage = '';

			try {
				parsedMessage = JSON.parse(message?.toString());
			} catch (error) {
				console.log('error', error);
			}

			this.broadcast({ message: JSON.stringify(parsedMessage) });
		});

		socket.on('close', () => {
			console.log('client disconnected');

			this.clients.get(clientId)?.delete(socket);

			if (!this.clients.get(clientId)?.size) {
				this.clients.delete(clientId);
			}

			for (const [_, sockets] of this.clients) {
				console.log('clientId', _, 'sockets', sockets.size);
			}

			if (!this.clients.size) {
				console.log('no clients');
			}
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
