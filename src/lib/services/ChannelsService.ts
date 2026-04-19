import { HydratedDocument, isValidObjectId, ObjectId } from 'mongoose';
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
	async getChannelById(params: { id: string | ObjectId }): Promise<{
		channel?: HydratedDocument<IChannel> | null;
		error?: any;
	}> {
		const { id } = params;

		try {
			const channel = await Channel.findOne({
				_id: id,
				deletedAt: null,
			});

			if (!channel) {
				return { error: 'Channel not found.' };
			}

			return { channel };
		} catch (error) {
			return { error };
		}
	}

	async createChannel(params: { payload: Partial<IChannel> }): Promise<{
		channel?: HydratedDocument<IChannel> | null | undefined;
		error?: any;
	}> {
		const { payload } = params;

		try {
			const channel = await Channel.create(payload);

			return { channel };
		} catch (error) {
			return { error };
		}
	}

	async updateChannel(params: {
		id: string | ObjectId;
		payload: Partial<IChannel>;
	}): Promise<{
		channel?: HydratedDocument<IChannel> | null;
		error?: any;
	}> {
		const { id, payload } = params;
		const propsToOmit: (keyof IChannel)[] = ['_id', 'createdAt'];
		const parsedPayload = omit(payload, propsToOmit) as Partial<IChannel>;

		try {
			const channel = await Channel.findByIdAndUpdate(
				{ _id: id },
				parsedPayload
			);

			return { channel };
		} catch (error) {
			return { error };
		}
	}

	async getChannelsByUserId(params: {
		userId: string | ObjectId;
		page?: number;
		sizePerPage?: number;
	}): Promise<{
		channels?: HydratedDocument<IChannel>[] | null;
		pagination?: IPagination;
		error?: any;
	}> {
		const { userId, page = 1, sizePerPage = 10 } = params;

		if (!isValidObjectId(userId)) {
			return { error: 'Invalid userId' };
		}

		try {
			// TODO: optimize query
			// For now it's fine without pagination, but in the future we should optimize it
			const userChannelMembersData = (await ChannelMember.find({
				userId,
				deletedAt: null,
				status: {
					$nin: [
						ChannelMemberStatusEnum.BANNED,
						ChannelMemberStatusEnum.REMOVED,
						ChannelMemberStatusEnum.PENDING,
					],
				},
			})
				.sort({ createdAt: 'desc' })
				.select('channelId')) as HydratedDocument<
				Pick<IChannelMember, 'channelId' | '_id'>
			>[];

			const userChannelIds = userChannelMembersData.map(
				(channelMember) => channelMember?.channelId
			);

			const totalItems = await Channel.find({
				_id: { $in: userChannelIds },
				deletedAt: null,
			}).countDocuments();

			const channels = await Channel.find({
				_id: { $in: userChannelIds },
				deletedAt: null,
			})
				.sort({ createdAt: 'desc' })
				.skip((page - 1) * sizePerPage)
				.limit(sizePerPage);

			return {
				channels,
				pagination: getPagination({ page, sizePerPage, totalItems }),
			};
		} catch (error) {
			return { error };
		}
	}

	async getChannelMembersByChannelId(params: {
		channelId: string | ObjectId;
		page?: number;
		sizePerPage?: number;
	}): Promise<{
		channelMembers?: ChannelMemberWithUser[] | null;
		error?: any;
		pagination?: IPagination;
	}> {
		const { channelId, page = 1, sizePerPage = 10 } = params;

		if (!isValidObjectId(channelId)) {
			return { error: 'Invalid channelId' };
		}

		try {
			const totalItems = await ChannelMember.find({
				channelId,
				deletedAt: null,
				status: {
					$nin: [
						ChannelMemberStatusEnum.BANNED,
						ChannelMemberStatusEnum.REMOVED,
						ChannelMemberStatusEnum.PENDING,
					],
				},
			}).countDocuments();

			const channelMembers = await ChannelMember.find({
				channelId,
				deletedAt: null,
				status: {
					$nin: [
						ChannelMemberStatusEnum.BANNED,
						ChannelMemberStatusEnum.REMOVED,
						ChannelMemberStatusEnum.PENDING,
					],
				},
			})
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
			return { error };
		}
	}

	async getChannelMember(params: {
		channelMemberId?: string | ObjectId;
		userId?: string | ObjectId;
		channelId?: string | ObjectId;
	}): Promise<{
		channelMember?: IChannelMember | null;
		error?: any;
	}> {
		const { userId, channelId, channelMemberId } = params;
		const hasValidChannelMemberId = isValidObjectId(channelMemberId);
		const hasValidUserId = isValidObjectId(userId);
		const hasValidChannelId = isValidObjectId(channelId);

		if (!hasValidChannelMemberId && (!hasValidUserId || !hasValidChannelId)) {
			return { error: 'Invalid userId/channelId/channelMemberId' };
		}

		try {
			const channelMember = await ChannelMember.findOne({
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
			});

			return { channelMember };
		} catch (error) {
			return { error };
		}
	}

	async createChannelMember(params: {
		payload: Partial<IChannelMember>;
	}): Promise<{
		channelMember?: Partial<IChannelMember> | null;
		error?: any;
	}> {
		const { payload } = params;
		const propsToOmit: (keyof IChannelMember)[] = ['deletedAt', 'updatedAt'];
		const parsedPayload = omit(payload, propsToOmit) as Partial<IChannelMember>;

		try {
			const channelMember = await ChannelMember.create(parsedPayload);

			return { channelMember };
		} catch (error) {
			return { error };
		}
	}

	async updateChannelMember(params: {
		id: string | ObjectId;
		payload: Partial<IChannelMember>;
	}): Promise<{
		channelMember?: Partial<IChannelMember> | null;
		error?: any;
	}> {
		const { id, payload } = params;
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
				parsedPayload
			);

			return { channelMember };
		} catch (error) {
			return { error };
		}
	}
}

const channelsService = new ChannelsService();

export { channelsService, type ChannelsService };
