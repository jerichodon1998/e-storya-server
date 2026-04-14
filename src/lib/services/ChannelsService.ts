import { HydratedDocument, isValidObjectId, ObjectId } from 'mongoose';
import {
	ChannelMemberWithUser,
	IChannel,
	IChannelMember,
	IUser,
} from '@/shared/types';
import { Channel, ChannelMember } from '@/lib/db/schemas';
import { ChannelMemberStatusEnum } from '@/shared/enums';
import { omit } from 'lodash-es';

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
		channel?: HydratedDocument<IChannel> | null;
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

	async getChannelsByUserId(params: { userId: string | ObjectId }): Promise<{
		channels?: HydratedDocument<IChannel>[] | null;
		error?: any;
	}> {
		const { userId } = params;

		if (!isValidObjectId(userId)) {
			return { error: 'Invalid userId' };
		}

		try {
			const userChannelMembersData = await ChannelMember.find({
				userId,
				deletedAt: null,
				status: {
					$nin: [
						ChannelMemberStatusEnum.BANNED,
						ChannelMemberStatusEnum.REMOVED,
						ChannelMemberStatusEnum.PENDING,
					],
				},
			});
			const userChannelIds = userChannelMembersData.map(
				(channelMember) => channelMember?.channelId
			);

			const channels = await Channel.find({
				_id: { $in: userChannelIds },
				deletedAt: null,
			});

			return { channels };
		} catch (error) {
			console.log('error', error);
			return { error };
		}
	}

	async getChannelMembersByChannelId(params: {
		channelId: string | ObjectId;
	}): Promise<{
		channelMembers?: ChannelMemberWithUser[] | null;
		error?: any;
	}> {
		const { channelId } = params;

		if (!isValidObjectId(channelId)) {
			return { error: 'Invalid channelId' };
		}

		try {
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
				.exec();

			return {
				channelMembers: channelMembers as ChannelMemberWithUser[],
			};
		} catch (error) {
			console.log('error', error);
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
			console.log('error', error);
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
			console.log('error', error);
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
			console.log('error', error);
			return { error };
		}
	}
}

const channelsService = new ChannelsService();

export { channelsService, type ChannelsService };
