import { isMemberOfChannel, isOwnerOfChannel } from '@src/helpers';
import { channelsService } from '@src/lib';
import { ChannelMemberRoleEnum, ChannelTypeEnum } from '@src/shared/enums';
import {
	ChannelMemberWithUser,
	IChannel,
	IPagination,
} from '@src/shared/types';
import { FastifyReply, FastifyRequest } from 'fastify';
import { isValidObjectId } from 'mongoose';

export async function getUserChannelsController(
	request: FastifyRequest,
	reply: FastifyReply
): Promise<{
	channels?: IChannel[] | null | undefined;
	error?: any;
	message?: string;
	pagination?: IPagination | undefined;
}> {
	const user = request.user;

	const { channels, error, pagination } =
		await channelsService.getChannelsByUserId({
			userId: user._id,
		});

	if (error) {
		reply.status(500);
		return { error };
	}

	reply.status(200);
	return { channels, pagination };
}

export async function getChannelController(
	request: FastifyRequest<{
		Params: {
			channelId: string;
		};
	}>,
	reply: FastifyReply
): Promise<{
	channel?: IChannel | null | undefined;
	error?: any;
	message?: string;
	pagination?: IPagination | undefined;
}> {
	const { channelId } = request.params;
	const userId = request.user._id;

	const { channelMember, error: channelMemberError } =
		await channelsService.getChannelMember({ channelId, userId });

	if (channelMemberError) {
		reply.status(500);
		return { error: channelMemberError };
	}

	if (
		!channelMember ||
		!isMemberOfChannel({
			role: channelMember?.role,
			status: channelMember?.status,
		})
	) {
		reply.status(401);
		return { error: 'Unauthorized' };
	}

	const { channel, error } = await channelsService.getChannelById({
		id: channelId,
	});

	if (error) {
		reply.status(500);
		return { error };
	}

	reply.status(200);
	return { channel };
}

export async function getChannelMembersController(
	request: FastifyRequest<{
		Params: {
			channelId: string;
		};
	}>,
	reply: FastifyReply
): Promise<{
	channelMembers?: ChannelMemberWithUser[] | null | undefined;
	error?: any;
	message?: string;
	pagination?: IPagination | undefined;
}> {
	const user = request.user;
	const { channelId } = request.params;

	const { channelMember, error: channelMemberError } =
		await channelsService.getChannelMember({ channelId, userId: user._id });

	if (
		channelMemberError ||
		!channelMember ||
		!isMemberOfChannel({
			role: channelMember?.role,
			status: channelMember?.status,
		})
	) {
		reply.status(401);
		return { error: 'Unauthorized' };
	}

	const { channelMembers, error, pagination } =
		await channelsService.getChannelMembersByChannelId({
			channelId: channelId,
		});

	if (error) {
		reply.status(500);
		return { error };
	}

	reply.status(200);
	return { channelMembers, pagination };
}

export async function createChannelController(
	request: FastifyRequest<{
		Body: {
			name: string;
			channelType: ChannelTypeEnum;
		};
	}>,
	reply: FastifyReply
): Promise<{
	channel?: IChannel | null | undefined;
	error?: any;
	message?: string;
}> {
	const { name, channelType } = request.body;
	const userId = request.user._id;

	const { channel, error } = await channelsService.createChannel({
		payload: {
			name,
			channelType,
			ownerId: userId,
		},
	});

	if (error) {
		reply.status(500);
		return { error };
	}

	reply.status(200);
	return { channel };
}

export async function updateChannelController(
	request: FastifyRequest<{
		Body: {
			name: string;
			channelId: string;
			ownerId: string;
		};
	}>,
	reply: FastifyReply
): Promise<{
	channel?: IChannel | null | undefined;
	error?: any;
	message?: string;
}> {
	const { name, channelId, ownerId } = request.body;
	const user = request.user;
	const { channelMember, error: channelMemberError } =
		await channelsService.getChannelMember({ channelId, userId: user._id });
	const isUserOwner =
		channelMember &&
		isOwnerOfChannel({
			role: channelMember?.role,
			status: channelMember?.status,
		});
	const isMemberOwnerOrAdmin =
		!channelMemberError &&
		channelMember &&
		(isUserOwner ||
			isMemberOfChannel({
				role: channelMember?.role,
				status: channelMember?.status,
			}));

	if (!isMemberOwnerOrAdmin) {
		reply.status(401);
		return { error: 'Unauthorized' };
	}

	const { channel: channelToUpdate, error: channelToUpdateError } =
		await channelsService.getChannelById({ id: channelId });

	if (!channelToUpdate || channelToUpdateError) {
		reply.status(404);
		return { error: 'Channel not found' };
	}

	const isOwnerTransfer =
		isValidObjectId(ownerId) &&
		ownerId?.toString() !== channelToUpdate?.ownerId?.toString() &&
		channelToUpdate?._id?.toString() === user?._id?.toString();

	// TODO: do this in a transaction
	if (isOwnerTransfer) {
		const { channelMember, error } = await channelsService.updateChannelMember({
			id: channelToUpdate?._id?.toString(),
			payload: {
				role: ChannelMemberRoleEnum.OWNER,
				userId: ownerId,
			},
		});

		if (!channelMember || error) {
			reply.status(404);
			return { error };
		}
	}

	const { channel: updatedChannel, error } =
		await channelsService.updateChannel({
			id: channelId,
			payload: {
				name,
				...(isUserOwner && ownerId && { ownerId }), // only update ownerId if user is owner
			},
		});

	if (error) {
		reply.status(500);
		return { error };
	}

	reply.status(200);
	return { channel: updatedChannel };
}
