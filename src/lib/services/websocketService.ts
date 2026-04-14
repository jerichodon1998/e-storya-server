import { messagesService } from '@lib/services/MessagesService';
import { MessageTypeEnum } from '@src/shared/enums';
import { IMessage } from '@src/shared/types';
import { isValidObjectId, ObjectId } from 'mongoose';
import { WebSocket } from 'ws';
import { channelsService } from './ChannelsService';

class WebSocketService {
	/**
	 * Map for storing sockets of each user.
	 * - key: user id
	 * - value: set of sockets
	 */
	private usersToSockets: Map<string, Set<WebSocket>> = new Map();
	/**
	 * Map for storing channels of each user.
	 * - key: channel id
	 * - value: set of user ids
	 */
	private channelsToUsers: Map<string, Set<string>> = new Map();
	/**
	 * Reverse map for storing channels of each user. This is made so that we can easily get all the channels of a user efficiently.
	 * - key: user id
	 * - value: set of channel ids
	 */
	private usersToChannels: Map<string, Set<string>> = new Map();

	private logClients() {
		console.log('usersToSockets:', this.usersToSockets.size);
		console.log('channelsToUsers:', this.channelsToUsers.size);
		console.log('usersToChannels:', this.usersToChannels.size);

		if (this.usersToSockets.size) {
			console.log('total set of user sockets:', this.usersToSockets.size);
			for (const [userId, sockets] of this.usersToSockets) {
				console.log(
					'userId: ',
					userId,
					'| total connected sockets:',
					sockets.size
				);
			}
		}

		if (this.channelsToUsers.size) {
			for (const [_, channels] of this.channelsToUsers) {
				console.log('total users connected to channels:', channels.size);
			}
		}
		console.log(
			'================================================================================'
		);
	}

	private async initUserChannelSubscribe(params: {
		userId: string | ObjectId;
		socket: WebSocket;
	}): Promise<void> {
		const { userId, socket } = params;
		console.log('initUserChannelSubscribe() userId:', userId);

		const { error, channels } = await channelsService.getChannelsByUserId({
			userId: userId,
		});

		if (error) {
			console.log('error', error);
			socket.close();
			return;
		}

		if (channels) {
			for (const channel of channels) {
				if (!this.channelsToUsers.get(channel._id?.toString())) {
					this.channelsToUsers.set(channel._id?.toString(), new Set());
				}

				this.channelsToUsers
					.get(channel._id?.toString())
					?.add(userId?.toString());

				if (!this.usersToChannels.get(userId?.toString())) {
					this.usersToChannels.set(userId?.toString(), new Set());
				}

				this.usersToChannels
					.get(userId?.toString())
					?.add(channel._id?.toString());
			}
		}
	}

	private initUserSocket(params: {
		userId: string | ObjectId;
		socket: WebSocket;
	}): void {
		const { userId, socket } = params;

		if (!this.usersToSockets.has(userId?.toString())) {
			this.usersToSockets.set(userId?.toString(), new Set());
		}

		this.usersToSockets.get(userId?.toString())?.add(socket);
	}

	// TODO: implement ping pong to check if client is still connected.
	async registerSocket(params: { userId: string; socket: WebSocket }) {
		const { socket, userId } = params;

		try {
			console.log('awaiting initUserChannelSubscribe()');
			await this.initUserChannelSubscribe({ userId, socket });

			if (socket.readyState !== WebSocket.OPEN) {
				console.log('Socket closed during initialization. Cleaning up...');
				this.cleanup({ userId, socket });
				return;
			}

			this.initUserSocket({ userId, socket });
		} catch (error) {
			this.cleanup({ userId, socket });
			socket.close(1011, 'Internal Error');
			return;
		}

		this.logClients();

		socket.on('message', (message: Buffer | ArrayBuffer | Buffer[]) => {
			try {
				const parsedMessage = JSON.parse(message?.toString()) as IMessage;
				console.log('parsedMessage', parsedMessage);

				const isAuthorizedToSendMessage = this.channelsToUsers
					.get(parsedMessage.channelId?.toString())
					?.has(userId?.toString());

				if (!isAuthorizedToSendMessage) {
					console.log('Unauthorized');
					socket.send(JSON.stringify({ error: 'Unauthorized' }));
					return;
				}

				this.broadcast({ message: parsedMessage });
			} catch (error: any) {
				console.log('error', error?.message);
			}
		});

		socket.on('error', () => {
			console.log('client on error');
			this.cleanup({ userId, socket });
			this.logClients();
		});

		socket.on('close', () => {
			console.log('client disconnected');
			this.cleanup({ userId, socket });
			this.logClients();
		});
	}

	private cleanup(params: { userId: string; socket: WebSocket }) {
		console.log('cleanup()');
		const { userId, socket } = params;

		console.log('delete user socket');
		// delete user's socket
		this.usersToSockets.get(userId)?.delete(socket);

		// delete user record from map if there's no sockets left associated with the user
		if (!this.usersToSockets.get(userId)?.size) {
			console.log('delete usersToSockets record');
			this.usersToSockets.delete(userId);

			const channels = this.usersToChannels.get(userId);
			console.log('delete usersToChannels record');
			this.usersToChannels.delete(userId);

			// delete user from all channels subscribed to
			if (channels) {
				for (const channel of channels) {
					console.log('delete channelToUsers');
					this.channelsToUsers.get(channel)?.delete(userId);

					// delete channel record from map if there's no users left associated with the channel
					if (!this.channelsToUsers.get(channel)?.size) {
						console.log('delete channelsToUsers record');
						this.channelsToUsers.delete(channel);
					}
				}
			}
		}
	}

	// TODO: implement subscribe user to channel
	unsubscribeUserFromChannel(params: {
		userId: string | ObjectId;
		channelId: string | ObjectId;
	}): void {
		const { userId, channelId } = params;
		const userIdString = userId?.toString();
		const channelIdString = channelId?.toString();

		if (!isValidObjectId(userIdString) || !isValidObjectId(channelIdString)) {
			return;
		}

		const userChannels = this.usersToChannels.get(userIdString);
		const channelUsers = this.channelsToUsers.get(channelIdString);
		if (userChannels?.has(channelIdString)) {
			userChannels.delete(channelIdString);

			if (userChannels.size <= 0) {
				this.usersToChannels.delete(userIdString);
			}
		}

		if (channelUsers?.has(userIdString)) {
			channelUsers.delete(userIdString);

			if (channelUsers.size <= 0) {
				this.channelsToUsers.delete(channelIdString);
			}
		}
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
		const channelId = parsedMessage.channelId;

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

			const users = this.channelsToUsers.get(channelId?.toString());

			if (users) {
				for (const user of users) {
					const userSockets = this.usersToSockets.get(user);

					if (userSockets) {
						for (const socket of userSockets) {
							if (socket.readyState === WebSocket.OPEN) {
								try {
									socket.send(stringifiedMessage);
								} catch (error) {
									console.log('error', error);
								}
							}
						}
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
