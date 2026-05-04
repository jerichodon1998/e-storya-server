import { messagesService } from '@lib/services/MessagesService';
import {
	ChannelMemberRoleEnum,
	ChannelMemberStatusEnum,
	ChannelTypeEnum,
	MessageTypeEnum,
	WebsocketChannelEventTypeEnum,
	WebsocketMessageEventTypeEnum,
} from '@src/shared/enums';
import {
	ChannelMemberWithUser,
	IChannel,
	IChatWebsocketPayload,
	IMessage,
} from '@src/shared/types';
import mongoose, { isValidObjectId, ObjectId } from 'mongoose';
import { WebSocket } from 'ws';
import { channelsService } from './ChannelsService';
import { validateDirectMessageUniqueKey } from '@src/helpers';
import { head, isEmpty } from 'lodash-es';

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

	/**
	 * Logs the clients.
	 * - this is for debugging purposes only.
	 *
	 * @return {void}
	 */
	private logClients(): void {
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

	/**
	 * Initializes user channel subscribe.
	 *
	 * @param {string | ObjectId} params.userId
	 * @param {WebSocket} params.socket
	 * @return {Promise<void>}
	 */
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
			for (const { channel } of channels) {
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

	/**
	 * Initializes user socket.
	 * - sets the socket to the user's set of sockets.
	 *
	 * @param {string | ObjectId} params.userId
	 * @param {WebSocket} params.socket
	 * @return {void}
	 */
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

	/**
	 * Register socket.
	 * - initializes the user channel subscribe
	 * - sets the socket to the user's set of sockets
	 *
	 * @param {string} params.userId
	 * @param {WebSocket} params.socket
	 * @return {Promise<void>}
	 */
	// TODO: implement ping pong to check if client is still connected.
	async registerSocket(params: {
		userId: string;
		socket: WebSocket;
	}): Promise<void> {
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

		socket.on('message', async (payload: Buffer | ArrayBuffer | Buffer[]) => {
			try {
				const parsedPayload = JSON.parse(
					payload?.toString()
				) as IChatWebsocketPayload;

				const channelId = parsedPayload?.message?.channelId?.toString() || '';

				const directMessageUniqueKey = validateDirectMessageUniqueKey(
					parsedPayload?.directMessageUniqueKey || ''
				)
					? parsedPayload?.directMessageUniqueKey
					: undefined;

				const channel = isValidObjectId(channelId)
					? (await channelsService.getChannelById({ id: channelId })).channel
					: undefined;

				// throw error if provided channelId doesn't exist
				if (isValidObjectId(channelId) && !channel) {
					socket.send(JSON.stringify({ error: 'Channel not found.' }));
					return;
				}

				const isAuthorizedToSendMessage = this.channelsToUsers
					.get(channelId)
					?.has(userId?.toString());

				if (!isAuthorizedToSendMessage && channelId) {
					socket.send(JSON.stringify({ error: 'Unauthorized' }));
					return;
				}

				if (!isEmpty(parsedPayload?.message)) {
					this.broadcast({
						message: parsedPayload?.message,
						...(directMessageUniqueKey && { directMessageUniqueKey }),
						channel,
						event: WebsocketMessageEventTypeEnum.MESSAGE_SENDING,
					});
				}
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

	/**
	 * Cleanup WebSocket and any in-memory [usersToSockets, usersToChannels, channelsToUsers] related data.
	 *
	 * @param {string} params.userId
	 * @param {WebSocket} params.socket
	 * @return {void}
	 */
	private cleanup(params: { userId: string; socket: WebSocket }): void {
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

	/**
	 * Unsubscribe user from channel.
	 *
	 * @param {string | ObjectId} params.userId
	 * @param {string | ObjectId} params.channelId
	 * @return {void}
	 */
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

	subscribeUserToChannel(params: {
		userId: string | ObjectId;
		channelId: string | ObjectId;
	}) {
		console.log('subscribeUserToChannel()');

		const { userId, channelId } = params;

		if (!isValidObjectId(userId) || !isValidObjectId(channelId)) {
			console.error('Invalid userId or channelId');
			return;
		}

		const userIdString = userId?.toString();
		const channelIdString = channelId?.toString();

		if (!this.usersToChannels.has(userIdString)) {
			this.usersToChannels.set(userIdString, new Set());
		}

		this.usersToChannels.get(userIdString)?.add(channelIdString);

		if (!this.channelsToUsers.has(channelIdString)) {
			this.channelsToUsers.set(channelIdString, new Set());
		}

		this.channelsToUsers.get(channelIdString)?.add(userIdString);
	}

	/**
	 * Broadcast message to all users in the channel.
	 *
	 * @param {string | Record<string, any>} params.message
	 * @return {Promise<void>}
	 */
	async broadcast(params: {
		message: string | Record<string, any>;
		directMessageUniqueKey?: string;
		channel?: IChannel | undefined | null;
		event: WebsocketMessageEventTypeEnum;
	}): Promise<void> {
		const parsedMessage: IMessage =
			typeof params.message === 'string'
				? JSON.parse(params.message)
				: params.message;
		const channelId = parsedMessage?.channelId;
		const channel = params?.channel;
		const directMessageUniqueKey = params?.directMessageUniqueKey || '';
		const shouldCreateDirectMessageChannel =
			!channel && validateDirectMessageUniqueKey(directMessageUniqueKey || '');

		try {
			let newInsertedMessage: IMessage | undefined = undefined;
			let finalChannel: IChannel | undefined | null = channel;
			let isDirectMessageChannel =
				shouldCreateDirectMessageChannel ||
				channel?.channelType === ChannelTypeEnum.DIRECT_MESSAGE;
			let directMessageChannelMembers:
				| ChannelMemberWithUser[]
				| undefined
				| null = undefined;

			await mongoose.connection.transaction(async (session) => {
				if (shouldCreateDirectMessageChannel) {
					// create new channel members
					const separatedIds = directMessageUniqueKey.split('-');
					const userId1 = separatedIds[0] || '';
					const userId2 = separatedIds[1] || '';

					if (!isValidObjectId(userId1) || !isValidObjectId(userId2)) {
						throw new Error('Invalid userId');
					}

					const { channel: newDirectMessageChannel, error } =
						await channelsService.createChannel({
							payload: {
								channelType: ChannelTypeEnum.DIRECT_MESSAGE,
								directMessageUniqueKey,
							},
							session,
							upsert: true,
							shouldThrowError: true,
						});

					if (error || !newDirectMessageChannel) {
						throw error || new Error('Channel not created');
					}

					for (const userId of [userId1, userId2]) {
						const { channelMember, error } =
							await channelsService.createChannelMember({
								payload: {
									role: ChannelMemberRoleEnum.MEMBER,
									userId,
									channelId: newDirectMessageChannel?._id || '',
									status: ChannelMemberStatusEnum.ACTIVE,
								},
								session,
								shouldThrowError: true,
								upsert: true,
							});

						if (error || !channelMember) {
							throw error || new Error('Channel member not created');
						}
					}

					for (const userId of [userId1, userId2]) {
						if (this.usersToSockets.get(userId)) {
							this.subscribeUserToChannel({
								userId,
								channelId: newDirectMessageChannel?._id || '',
							});
						}
					}

					this.logClients();

					finalChannel = newDirectMessageChannel;
				}

				const messages = await messagesService.insertMessages({
					messages: [
						{
							...parsedMessage,
							channelId: finalChannel?._id || '',
							type: MessageTypeEnum.TEXT,
						},
					],
					shouldThrowError: true,
					session,
				});

				newInsertedMessage = head(messages.messages);

				directMessageChannelMembers = isDirectMessageChannel
					? (
							await channelsService.getChannelMembersByChannelId({
								channelId: finalChannel?._id || '',
								shouldThrowError: true,
								session,
							})
						)?.channelMembers
					: undefined;

				finalChannel = (
					await channelsService.updateChannel({
						id: finalChannel?._id || '',
						payload: {
							lastActivityAt: new Date(),
						},
						shouldThrowError: true,
						session,
					})
				)?.channel;
			});

			const users = this.channelsToUsers.get(
				channelId?.toString() || finalChannel?._id?.toString() || ''
			);

			if (users) {
				for (const user of users) {
					const userSockets = this.usersToSockets.get(user);
					const payloadWithMessage: IChatWebsocketPayload | undefined =
						newInsertedMessage
							? {
									event: WebsocketMessageEventTypeEnum.MESSAGE_CREATED,
									message: newInsertedMessage,
								}
							: undefined;
					const payloadWithChannel: IChatWebsocketPayload | undefined =
						finalChannel
							? {
									event: WebsocketChannelEventTypeEnum.CHANNEL_CREATED,
									directMessageChannelMembers,
									channel: finalChannel,
								}
							: undefined;

					if (userSockets) {
						for (const socket of userSockets) {
							if (socket.readyState === WebSocket.OPEN) {
								try {
									if (payloadWithChannel) {
										socket.send(JSON.stringify(payloadWithChannel));
									}

									if (payloadWithMessage) {
										socket.send(JSON.stringify(payloadWithMessage));
									}
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
