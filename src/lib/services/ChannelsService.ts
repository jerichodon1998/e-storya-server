import mongoose, {
	HydratedDocument,
	isValidObjectId,
	ObjectId,
} from 'mongoose';
import {
	ChannelMemberWithUser,
	IChannel,
	IChannelMember,
	IPagination,
	IUser,
} from '@src/shared/types';
import { Channel, ChannelMember } from '@src/lib/db/schemas';
import { ChannelMemberStatusEnum } from '@src/shared/enums';
import { omit } from 'lodash-es';
import { getPagination } from '@src/helpers';

class ChannelsService {
	async getChannelById(params: {
		id: string | ObjectId;
		shouldThrowError?: boolean;
		session?: mongoose.mongo.ClientSession;
	}): Promise<{
		channel?: HydratedDocument<IChannel> | null;
		error?: any;
	}> {
		const { id, shouldThrowError = false, session = undefined } = params;

		try {
			const channel = session
				? await Channel.findOne({
						_id: id,
						deletedAt: null,
					}).session(session)
				: await Channel.findOne({
						_id: id,
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

	async createChannel(params: {
		payload: Partial<IChannel>;
		shouldThrowError?: boolean;
		session?: mongoose.mongo.ClientSession;
	}): Promise<{
		channel?: HydratedDocument<IChannel> | null | undefined;
		error?: any;
	}> {
		const { payload, shouldThrowError = false, session = undefined } = params;

		try {
			const channel = new Channel(payload);
			await channel.save({ ...(session && { session }) });

			return { channel };
		} catch (error) {
			if (shouldThrowError) {
				throw error;
			}

			return { error };
		}
	}

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

	async getChannelsByUserId(params: {
		userId: string | ObjectId;
		page?: number;
		sizePerPage?: number;
		shouldThrowError?: boolean;
		session?: mongoose.mongo.ClientSession;
	}): Promise<{
		channels?: HydratedDocument<IChannel>[] | null;
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

			return {
				channels,
				pagination: getPagination({ page, sizePerPage, totalItems }),
			};
		} catch (error) {
			if (shouldThrowError) {
				throw error;
			}

			return { error };
		}
	}

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

	async createChannelMember(params: {
		payload: Partial<IChannelMember>;
		shouldThrowError?: boolean;
		session?: mongoose.mongo.ClientSession;
	}): Promise<{
		channelMember?: Partial<IChannelMember> | null;
		error?: any;
	}> {
		const { payload, shouldThrowError = false, session = undefined } = params;
		const propsToOmit: (keyof IChannelMember)[] = ['deletedAt', 'updatedAt'];
		const parsedPayload = omit(payload, propsToOmit) as Partial<IChannelMember>;

		try {
			const channelMember = new ChannelMember(parsedPayload);
			await channelMember.save({ ...(session && { session }) });

			return { channelMember };
		} catch (error) {
			if (shouldThrowError) {
				throw error;
			}

			return { error };
		}
	}

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
