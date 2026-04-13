import { ChannelTypeEnum, CollectionNamesEnum } from '@/shared/enums';
import { IChannel } from '@/shared/types';
import mongoose, { Schema, model } from 'mongoose';

const channelSchema = new Schema<IChannel>({
	_id: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		default: () => new mongoose.Types.ObjectId(),
	},
	createdAt: { type: Date, required: true, default: () => Date.now() },
	updatedAt: { type: Date },
	deletedAt: { type: Date },
	ownerId: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		ref: CollectionNamesEnum.USERS,
	},
	name: { type: String, required: true },
	channelType: { type: String, required: true, enum: ChannelTypeEnum },
});

const Channel = model<IChannel>(
	CollectionNamesEnum.CHANNELS,
	channelSchema,
	CollectionNamesEnum.CHANNELS
);

export { Channel };
