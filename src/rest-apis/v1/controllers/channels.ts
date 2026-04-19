import { getErrorMessage, isMemberOfChannel } from '@src/helpers';
import { channelsService } from '@src/lib';
import { ChannelMemberRoleEnum, ChannelTypeEnum } from '@src/shared/enums';
import {
	ChannelMemberWithUser,
	IChannel,
	IPagination,
} from '@src/shared/types';
import { FastifyReply, FastifyRequest } from 'fastify';
import mongoose, { HydratedDocument, isValidObjectId } from 'mongoose';

/**
 * Get user channels controller.
 *
 * @param {FastifyRequest} request
 * @param {FastifyReply} reply
 * @return {Promise<{ channels?: IChannel[] | null | undefined; error?: any; message?: string; pagination?: IPagination | undefined; }>}
 */
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
		return { error, message: getErrorMessage({ error }) };
	}

	reply.status(200);
	return { channels, pagination, message: 'Success' };
}

/**
 * Get channel controller.
 *
 * @param {FastifyRequest<{ Params: { channelId: string; }; }>} request
 * @param {FastifyReply} reply
 * @return {Promise<{ channel?: IChannel | null | undefined; error?: any; message?: string; pagination?: IPagination | undefined; }>}
 */
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
		return {
			error: channelMemberError,
			message: getErrorMessage({ error: channelMemberError }),
		};
	}

	if (
		!channelMember ||
		!isMemberOfChannel({
			role: channelMember?.role,
			status: channelMember?.status,
		})
	) {
		reply.status(401);
		return { error: 'Unauthorized.', message: 'Unauthorized.' };
	}

	const { channel, error } = await channelsService.getChannelById({
		id: channelId,
	});

	if (error) {
		reply.status(500);
		return { error, message: getErrorMessage({ error }) };
	}

	reply.status(200);
	return { channel, message: 'Success.' };
}

/**
 * Get channel members controller.
 *
 * @param {FastifyRequest<{ Params: { channelId: string; }; }>} request
 * @param {FastifyReply} reply
 * @return {Promise<{ channelMembers?: ChannelMemberWithUser[] | null | undefined; error?: any; message?: string; pagination?: IPagination | undefined; }>}
 */
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
		return { error: 'Unauthorized.', message: 'Unauthorized.' };
	}

	const { channelMembers, error, pagination } =
		await channelsService.getChannelMembersByChannelId({
			channelId: channelId,
		});

	if (error) {
		reply.status(500);
		return { error, message: getErrorMessage({ error }) };
	}

	reply.status(200);
	return { channelMembers, pagination, message: 'Success.' };
}

/**
 * Create channel controller.
 *
 * @param {FastifyRequest<{ Body: { name: string; channelType: ChannelTypeEnum; }; }>} request
 * @param {FastifyReply} reply
 * @return {Promise<{ channel?: IChannel | null | undefined; error?: any; message?: string; }>}
 */
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

	try {
		let channel: IChannel | null | undefined = null;
		await mongoose.connection.transaction(async (session) => {
			const { channel: newChannel } = await channelsService.createChannel({
				payload: {
					name,
					channelType,
					ownerId: userId,
				},
				session,
				shouldThrowError: true,
			});

			if (!newChannel) {
				throw new Error('Channel not created');
			}

			const { channelMember } = await channelsService.createChannelMember({
				payload: {
					role: ChannelMemberRoleEnum.OWNER,
					userId: userId,
					channelId: newChannel?._id.toString(),
				},
				session,
				shouldThrowError: true,
			});

			if (!channelMember) {
				throw new Error('Channel member not created');
			}
		});

		reply.status(200);
		return { channel, message: 'Success.' };
	} catch (error) {
		reply.status(500);
		return { error, message: getErrorMessage({ error }) };
	}
}

/**
 * Update channel controller.
 *
 * @param {FastifyRequest<{ Params: { channelId: string; }; Body: { name: string; ownerId: string; }; }>} request
 * @param {FastifyReply} reply
 * @return {Promise<{ channel?: IChannel | null | undefined; error?: any; message?: string; }>}
 */
export async function updateChannelController(
	request: FastifyRequest<{
		Params: {
			channelId: string;
		};
		Body: {
			name: string;
			ownerId: string;
		};
	}>,
	reply: FastifyReply
): Promise<{
	channel?: IChannel | null | undefined;
	error?: any;
	message?: string;
}> {
	const { name, ownerId } = request.body;
	const { channelId } = request.params;
	const user = request.user;
	const { channelMember, error: channelMemberError } =
		await channelsService.getChannelMember({ channelId, userId: user._id });
	const isAtLeastAMember =
		!channelMemberError &&
		channelMember &&
		isMemberOfChannel({
			role: channelMember?.role,
			status: channelMember?.status,
		});

	if (!isAtLeastAMember) {
		reply.status(401);
		return { error: 'Unauthorized', message: 'Unauthorized.' };
	}

	const { channel: channelToUpdate, error: channelToUpdateError } =
		await channelsService.getChannelById({ id: channelId });

	if (!channelToUpdate || channelToUpdateError) {
		reply.status(404);
		return { error: 'Channel not found', message: 'Channel not found.' };
	}

	const isOwnerTransfer =
		isValidObjectId(ownerId) &&
		ownerId?.toString() !== channelToUpdate?.ownerId?.toString() &&
		channelToUpdate?.ownerId?.toString() === user?._id?.toString();

	try {
		let channel: HydratedDocument<IChannel> | null | undefined = null;

		await mongoose.connection.transaction(async (session) => {
			const dateNow = new Date();

			// update channel current and new owner
			if (isOwnerTransfer) {
				const { channelMember: newOwner, error: newOwnerError } =
					await channelsService.getChannelMember({
						channelId,
						userId: ownerId,
						shouldThrowError: true,
						session,
					});

				if (!newOwner || newOwnerError) {
					throw new Error('Channel member not found');
				}

				const {
					channelMember: updatedNewChannelOwner,
					error: updateNewChannelOwnerError,
				} = await channelsService.updateChannelMember({
					id: newOwner._id.toString(),
					payload: {
						role: ChannelMemberRoleEnum.OWNER,
						updatedAt: dateNow,
					},
					shouldThrowError: true,
					session,
				});

				if (!updatedNewChannelOwner || updateNewChannelOwnerError) {
					throw new Error('New channel owner not updated');
				}

				const {
					channelMember: updatedCurrentChannelOwner,
					error: updateCurrentChannelOwnerError,
				} = await channelsService.updateChannelMember({
					id: channelMember._id.toString(),
					payload: {
						role: ChannelMemberRoleEnum.MEMBER,
						updatedAt: dateNow,
					},
					shouldThrowError: true,
					session,
				});

				if (!updatedCurrentChannelOwner || updateCurrentChannelOwnerError) {
					throw new Error('Current channel owner not updated');
				}
			}

			const { channel: updatedChannel, error } =
				await channelsService.updateChannel({
					id: channelId,
					payload: {
						name,
						...(isOwnerTransfer && { ownerId }), // only update ownerId if user is owner
					},
					shouldThrowError: true,
					session,
				});

			if (!updatedChannel || error) {
				throw new Error('Channel not updated');
			}

			channel = updatedChannel;
		});

		reply.status(200);
		return { channel, message: 'Success.' };
	} catch (error: any) {
		reply.status(500);
		return { error, message: getErrorMessage({ error }) };
	}
}

// TODO: implement invite user to channel
