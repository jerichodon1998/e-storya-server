import { messagesService } from './MessagesService';
import { IMessage, MessageTypeEnum } from '../types';
import { WebSocket } from 'ws';

class WebSocketService {
	clients: Map<string, WebSocket> = new Map();

	registerSocket(params: { clientId: string; socket: WebSocket }) {
		const { socket, clientId } = params;

		this.clients.set(params.clientId, params.socket);
		console.log('clients', this.clients.keys());

		socket.on('message', (message: Buffer | ArrayBuffer | Buffer[]) => {
			let parsedMessage = '';

			try {
				parsedMessage = JSON.parse(message?.toString());
				console.log('parsedMessage', parsedMessage);
			} catch (error) {
				console.log('error', error);
			}

			this.broadcast({ message: JSON.stringify(parsedMessage) });
		});

		socket.on('close', () => {
			console.log('user disconnected');
			this.clients.delete(clientId);
			console.log('clients', this.clients.keys());
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

			for (const [_, socket] of this.clients) {
				if (socket.readyState === WebSocket.OPEN) {
					console.log('broadcasting', stringifiedMessage);
					socket.send(stringifiedMessage);
				}
			}
		} catch (error) {
			console.log('error', error);
		}
	}
}

const websocketService = new WebSocketService();

export { websocketService };
