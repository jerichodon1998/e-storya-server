import mongoose, {
	HydratedDocument,
	isValidObjectId,
	ObjectId,
} from 'mongoose';
import {
	ChannelMemberWithUser,
	IChannel,
	IChannelMember,
	IChannelWithDirectMessageChannelMembers,
	IPagination,
	IUser,
} from '@src/shared/types';
import {
	Channel,
	ChannelDirectMessage,
	ChannelGroup,
	ChannelMember,
} from '@src/lib/db/schemas';
import { ChannelMemberStatusEnum, ChannelTypeEnum } from '@src/shared/enums';
import { map, omit } from 'lodash-es';
import {
	getErrorMessage,
	getPagination,
	validateDirectMessageUniqueKey,
} from '@src/helpers';

class ChannelsService {
	/**
	 * Get channel by ID.
	 *
	 * @param {string | ObjectId} params.id - The ID of the channel.
	 * @param {boolean} params.shouldThrowError=false - Whether to throw an error.
	 * @param {mongoose.mongo.ClientSession} params.session - The Mongoose session for transaction.
	 * @return {Promise<{ channel?: HydratedDocument<IChannel> | null; error?: any; }>}
	 */
	async getChannelById(params: {
		id?: string | ObjectId;
		directMessageUniqueKey?: string;
		shouldThrowError?: boolean;
		session?: mongoose.mongo.ClientSession;
	}): Promise<{
		channel?: HydratedDocument<IChannel> | null;
		error?: any;
	}> {
		const {
			id,
			directMessageUniqueKey,
			shouldThrowError = false,
			session = undefined,
		} = params;

		if (!id && directMessageUniqueKey) {
			if (shouldThrowError) {
				throw new Error('Invalid channelId');
			}

			return { error: 'Invalid channelId' };
		}

		try {
			const channel = session
				? await Channel.findOne({
						...(id && { _id: id }),
						...(directMessageUniqueKey && { directMessageUniqueKey }),
						deletedAt: null,
					}).session(session)
				: await Channel.findOne({
						...(id && { _id: id }),
						...(directMessageUniqueKey && { directMessageUniqueKey }),
						deletedAt: null,
					});

			if (!channel) {
				if (shouldThrowError) {
					throw new Error('Channel not found.');
				}

				return { error: 'Channel not found.' };
			}

			return { channel };
		} catch (error) {
			if (shouldThrowError) {
				throw error;
			}

			return { error };
		}
	}

	/**
	 * Create a channel.
	 *
	 * @param {Partial<IChannel>} params.payload - The payload to create the channel with.
	 * @param {boolean} params.shouldThrowError=false - Whether to throw an error.
	 * @param {mongoose.mongo.ClientSession} params.session - The Mongoose session for transaction.
	 * @return {Promise<{ channel?: HydratedDocument<IChannel> | null | undefined; error?: any; }>}
	 */
	async createChannel(params: {
		payload: Partial<IChannel>;
		upsert?: boolean;
		shouldThrowError?: boolean;
		session?: mongoose.mongo.ClientSession;
	}): Promise<{
		channel?: HydratedDocument<IChannel> | null | undefined;
		error?: any;
		message: string;
	}> {
		const {
			payload,
			shouldThrowError = false,
			session = undefined,
			upsert = false,
		} = params;
		const isDirectMessage =
			payload.channelType === ChannelTypeEnum.DIRECT_MESSAGE;

		try {
			let channel: HydratedDocument<IChannel> | null | undefined = null;

			if (upsert) {
				channel = isDirectMessage
					? await ChannelDirectMessage.findOneAndUpdate(
							{
								directMessageUniqueKey: payload?.directMessageUniqueKey || '',
							},
							{ ...payload },
							{
								upsert: true,
								returnDocument: 'after',
								...(session && { session }),
							}
						)
					: await ChannelGroup.findOneAndUpdate(
							{
								_id: payload?._id || '',
							},
							{ ...payload },
							{
								upsert: true,
								returnDocument: 'after',
								...(session && { session }),
							}
						);
			} else {
				channel = isDirectMessage
					? new ChannelDirectMessage(payload)
					: new ChannelGroup(payload);

				await channel?.save({
					...(session && { session }),
				});
			}

			return { channel, message: 'Success.' };
		} catch (error) {
			if (shouldThrowError) {
				throw error;
			}

			return { error, message: getErrorMessage({ error }) };
		}
	}

	/**
	 * Update a channel.
	 *
	 * @param {string | ObjectId} params.id - The ID of the channel to update.
	 * @param {Partial<IChannel>} params.payload - The payload to update the channel with.
	 * @param {boolean} params.shouldThrowError=false - Whether to throw an error.
	 * @param {mongoose.mongo.ClientSession} params.session - The Mongoose session for transaction.
	 * @return {Promise<{ channel?: HydratedDocument<IChannel> | null; error?: any; }>}
	 */
	async updateChannel(params: {
		id: string | ObjectId;
		payload: Partial<IChannel>;
		shouldThrowError?: boolean;
		session?: mongoose.mongo.ClientSession;
	}): Promise<{
		channel?: HydratedDocument<IChannel> | null;
		error?: any;
	}> {
		const {
			id,
			payload,
			shouldThrowError = false,
			session = undefined,
		} = params;
		const propsToOmit: (keyof IChannel)[] = ['_id', 'createdAt'];
		const parsedPayload = omit(payload, propsToOmit) as Partial<IChannel>;

		try {
			const channel = await Channel.findByIdAndUpdate(
				{ _id: id },
				parsedPayload,
				{ returnDocument: 'after', ...(session && { session }) }
			);

			return { channel };
		} catch (error) {
			if (shouldThrowError) {
				throw error;
			}

			return { error };
		}
	}

	/**
	 * Get channels by user ID.
	 *
	 * @param {string | ObjectId} params.userId - The ID of the user to get channels for.
	 * @param {number} params.page - The page number to get channels for.
	 * @param {number} params.sizePerPage - The size per page to get channels for.
	 * @param {boolean} params.shouldThrowError=false - Whether to throw an error.
	 * @param {mongoose.mongo.ClientSession} params.session - The Mongoose session for transaction.
	 * @return {Promise<{ channels?: HydratedDocument<IChannel>[] | null; pagination?: IPagination; error?: any; }>}
	 */
	async getChannelsByUserId(params: {
		userId: string | ObjectId;
		page?: number;
		sizePerPage?: number;
		shouldThrowError?: boolean;
		session?: mongoose.mongo.ClientSession;
	}): Promise<{
		channels?: IChannelWithDirectMessageChannelMembers[] | null;
		pagination?: IPagination;
		error?: any;
	}> {
		const {
			userId,
			page = 1,
			sizePerPage = 10,
			shouldThrowError = false,
			session = undefined,
		} = params;

		if (!isValidObjectId(userId)) {
			if (shouldThrowError) {
				throw new Error('Invalid userId');
			}

			return { error: 'Invalid userId' };
		}

		try {
			// TODO: optimize query
			// For now it's fine without pagination, but in the future we should optimize it
			const userChannelMembersData = (await ChannelMember.find(
				{
					userId,
					deletedAt: null,
					status: {
						$nin: [
							ChannelMemberStatusEnum.BANNED,
							ChannelMemberStatusEnum.REMOVED,
							ChannelMemberStatusEnum.PENDING,
						],
					},
				},
				null,
				{ ...(session && { session }) }
			)
				.sort({ createdAt: 'desc' })
				.select('channelId')) as HydratedDocument<
				Pick<IChannelMember, 'channelId' | '_id'>
			>[];

			const userChannelIds = userChannelMembersData.map(
				(channelMember) => channelMember?.channelId
			);

			const totalItems = await Channel.find(
				{
					_id: { $in: userChannelIds },
					deletedAt: null,
				},
				null,
				{ ...(session && { session }) }
			).countDocuments();

			const channels = await Channel.find(
				{
					_id: { $in: userChannelIds },
					deletedAt: null,
				},
				null,
				{ ...(session && { session }) }
			)
				.sort({ createdAt: 'desc' })
				.skip((page - 1) * sizePerPage)
				.limit(sizePerPage);

			const channelsWithPopulatedDirectMessageChannels: IChannelWithDirectMessageChannelMembers[] =
				await Promise.all(
					map(
						channels || [],
						async (
							channel
						): Promise<IChannelWithDirectMessageChannelMembers> => {
							const isDirectMessage = validateDirectMessageUniqueKey(
								channel?.directMessageUniqueKey || ''
							);

							if (isDirectMessage) {
								const { channelMembers } =
									await this.getChannelMembersByChannelId({
										channelId: channel?._id.toString() || '',
									});

								return {
									channel,
									directMessageChannelMembers: channelMembers,
								};
							}

							return { channel };
						}
					)
				);

			return {
				channels: channelsWithPopulatedDirectMessageChannels,
				pagination: getPagination({ page, sizePerPage, totalItems }),
			};
		} catch (error) {
			if (shouldThrowError) {
				throw error;
			}

			return { error };
		}
	}

	/**
	 * Get channel members by channel ID.
	 *
	 * @param {string | ObjectId} params.channelId - The ID of the channel to get channel members for.
	 * @param {number} params.page - The page number to get channel members for.
	 * @param {number} params.sizePerPage - The size per page to get channel members for.
	 * @param {boolean} params.shouldThrowError=false - Whether to throw an error.
	 * @param {mongoose.mongo.ClientSession} params.session - The Mongoose session for transaction.
	 * @return {Promise<{ channelMembers?: ChannelMemberWithUser[] | null; error?: any; pagination?: IPagination; }>}
	 */
	async getChannelMembersByChannelId(params: {
		channelId: string | ObjectId;
		page?: number;
		sizePerPage?: number;
		shouldThrowError?: boolean;
		session?: mongoose.mongo.ClientSession;
	}): Promise<{
		channelMembers?: ChannelMemberWithUser[] | null;
		error?: any;
		pagination?: IPagination;
	}> {
		const {
			channelId,
			page = 1,
			sizePerPage = 10,
			shouldThrowError = false,
			session = undefined,
		} = params;

		if (!isValidObjectId(channelId)) {
			if (shouldThrowError) {
				throw new Error('Invalid channelId');
			}

			return { error: 'Invalid channelId' };
		}

		try {
			const totalItems = await ChannelMember.find(
				{
					channelId,
					deletedAt: null,
					status: {
						$nin: [
							ChannelMemberStatusEnum.BANNED,
							ChannelMemberStatusEnum.REMOVED,
							ChannelMemberStatusEnum.PENDING,
						],
					},
				},
				null,
				{ ...(session && { session }) }
			).countDocuments();

			const channelMembers = await ChannelMember.find(
				{
					channelId,
					deletedAt: null,
					status: {
						$nin: [
							ChannelMemberStatusEnum.BANNED,
							ChannelMemberStatusEnum.REMOVED,
							ChannelMemberStatusEnum.PENDING,
						],
					},
				},
				null,
				{ ...(session && { session }) }
			)
				.populate<{ userId: IUser }>('userId')
				.sort({ createdAt: 'desc' })
				.skip((page - 1) * sizePerPage)
				.limit(sizePerPage)
				.exec();

			return {
				channelMembers: channelMembers as ChannelMemberWithUser[],
				pagination: getPagination({
					page,
					sizePerPage,
					totalItems: totalItems,
				}),
			};
		} catch (error) {
			if (shouldThrowError) {
				throw error;
			}

			return { error };
		}
	}

	/**
	 * Get a channel member.
	 * Either provide the following to get the channel member:
	 * - channelMemberId
	 * - userId & channelId
	 *
	 *
	 * @param {string | ObjectId} params.channelMemberId - The ID of the channel member to get.
	 * @param {string | ObjectId} params.userId - The ID of the user to get the channel member for.
	 * @param {string | ObjectId} params.channelId - The ID of the channel to get the channel member for.
	 * @param {boolean} params.shouldThrowError=false - Whether to throw an error.
	 * @param {mongoose.mongo.ClientSession} params.session - The Mongoose session for transaction.
	 * @return {Promise<{ channelMember?: IChannelMember | null; error?: any; }>}
	 */
	async getChannelMember(params: {
		channelMemberId?: string | ObjectId;
		userId?: string | ObjectId;
		channelId?: string | ObjectId;
		shouldThrowError?: boolean;
		session?: mongoose.mongo.ClientSession;
	}): Promise<{
		channelMember?: IChannelMember | null;
		error?: any;
	}> {
		const {
			userId,
			channelId,
			channelMemberId,
			shouldThrowError = false,
			session = undefined,
		} = params;
		const hasValidChannelMemberId = isValidObjectId(channelMemberId);
		const hasValidUserId = isValidObjectId(userId);
		const hasValidChannelId = isValidObjectId(channelId);

		if (!hasValidChannelMemberId && (!hasValidUserId || !hasValidChannelId)) {
			if (shouldThrowError) {
				throw new Error('Invalid userId/channelId/channelMemberId');
			}

			return { error: 'Invalid userId/channelId/channelMemberId' };
		}

		try {
			const channelMember = await ChannelMember.findOne(
				{
					...(hasValidChannelMemberId && { _id: channelMemberId }),
					...(hasValidUserId && { userId }),
					...(hasValidChannelId && { channelId }),
					deletedAt: null,
					status: {
						$nin: [
							ChannelMemberStatusEnum.BANNED,
							ChannelMemberStatusEnum.REMOVED,
							ChannelMemberStatusEnum.PENDING,
						],
					},
				},
				null,
				{ ...(session && { session }) }
			);

			return { channelMember };
		} catch (error) {
			if (shouldThrowError) {
				throw error;
			}

			return { error };
		}
	}

	/**
	 * Create a channel member.
	 *
	 * @param {Partial<IChannelMember>} params.payload - The payload to create the channel member with.
	 * @param {boolean} params.shouldThrowError=false - Whether to throw an error.
	 * @param {mongoose.mongo.ClientSession} params.session - The Mongoose session for transaction.
	 * @return {Promise<{ channelMember?: Partial<IChannelMember> | null; error?: any; }>}
	 */
	async createChannelMember(params: {
		payload: Partial<IChannelMember>;
		shouldThrowError?: boolean;
		upsert?: boolean;
		session?: mongoose.mongo.ClientSession;
	}): Promise<{
		channelMember?: IChannelMember | null;
		error?: any;
	}> {
		const {
			payload,
			shouldThrowError = false,
			session = undefined,
			upsert = false,
		} = params;
		const propsToOmit: (keyof IChannelMember)[] = ['deletedAt', 'updatedAt'];
		const parsedPayload = omit(payload, propsToOmit) as Partial<IChannelMember>;

		try {
			let channelMember: IChannelMember | null | undefined = null;

			if (upsert) {
				const createChannelMember = await ChannelMember.findOneAndUpdate(
					{
						userId: parsedPayload.userId || '',
						channelId: parsedPayload.channelId || '',
					},
					payload,
					{ upsert: true, returnDocument: 'after', ...(session && { session }) }
				);

				channelMember = createChannelMember;
			} else {
				channelMember = await new ChannelMember(parsedPayload).save({
					...(session && { session }),
				});
			}

			return { channelMember };
		} catch (error) {
			if (shouldThrowError) {
				throw error;
			}

			return { error };
		}
	}

	/**
	 * Update a channel member.
	 *
	 * @param {string | ObjectId} params.id - The ID of the channel member to update.
	 * @param {Partial<IChannelMember>} params.payload - The payload to update the channel member with.
	 * @param {boolean} params.shouldThrowError=false - Whether to throw an error.
	 * @param {mongoose.mongo.ClientSession} params.session - The Mongoose session for transaction.
	 * @return {Promise<{ channelMember?: Partial<IChannelMember> | null; error?: any; }>}
	 */
	async updateChannelMember(params: {
		id: string | ObjectId;
		payload: Partial<IChannelMember>;
		shouldThrowError?: boolean;
		session?: mongoose.mongo.ClientSession;
	}): Promise<{
		channelMember?: Partial<IChannelMember> | null;
		error?: any;
	}> {
		const {
			id,
			payload,
			shouldThrowError = false,
			session = undefined,
		} = params;
		const propsToOmit: (keyof IChannelMember)[] = [
			'_id',
			'createdAt',
			'userId',
			'channelId',
		];
		const parsedPayload = omit(payload, propsToOmit) as Partial<IChannelMember>;

		try {
			const channelMember = await ChannelMember.findByIdAndUpdate(
				{ _id: id },
				parsedPayload,
				{ returnDocument: 'after', ...(session && { session }) }
			);

			return { channelMember };
		} catch (error) {
			if (shouldThrowError) {
				throw error;
			}

			return { error };
		}
	}
}

const channelsService = new ChannelsService();

export { channelsService, type ChannelsService };
