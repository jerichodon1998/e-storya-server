import {
	ChannelMemberRoleEnum,
	ChannelMemberStatusEnum,
	CollectionNamesEnum,
} from '@/shared/enums';
import { IChannelMember } from '@/shared/types';
import mongoose, { Schema, model } from 'mongoose';

const channelMembersSchema = new Schema<IChannelMember>({
	_id: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		default: () => new mongoose.Types.ObjectId(),
	},
	createdAt: { type: Date, required: true, default: () => Date.now() },
	updatedAt: { type: Date },
	deletedAt: { type: Date },
	role: { type: String, required: true, enum: ChannelMemberRoleEnum },
	status: { type: String, required: true, enum: ChannelMemberStatusEnum },
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		ref: CollectionNamesEnum.USERS,
	},
	channelId: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		ref: CollectionNamesEnum.CHANNELS,
	},
});

const ChannelMember = model<IChannelMember>(
	CollectionNamesEnum.CHANNEL_MEMBERS,
	channelMembersSchema,
	CollectionNamesEnum.CHANNEL_MEMBERS
);

export { ChannelMember };
