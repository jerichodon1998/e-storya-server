import { validateDirectMessageUniqueKey } from '@src/helpers';
import { ChannelTypeEnum, CollectionNamesEnum } from '@src/shared/enums';
import { IChannel } from '@src/shared/types';
import mongoose, { Schema, SchemaOptions, model } from 'mongoose';

const schemaOptions: SchemaOptions<IChannel> = {
	discriminatorKey: 'channelType',
};

const channelSchema = new Schema<IChannel>(
	{
		_id: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			default: () => new mongoose.Types.ObjectId(),
		},
		createdAt: { type: Date, required: true, default: () => Date.now() },
		updatedAt: { type: Date },
		deletedAt: { type: Date },
		channelType: { type: String, required: true, enum: ChannelTypeEnum },
		lastActivityAt: { type: Date, default: () => Date.now() },
	},
	schemaOptions
);

const Channel = model<IChannel>(
	CollectionNamesEnum.CHANNELS,
	channelSchema,
	CollectionNamesEnum.CHANNELS
);

const ChannelDirectMessage = Channel.discriminator(
	ChannelTypeEnum.DIRECT_MESSAGE,
	new Schema<IChannel>(
		{
			directMessageUniqueKey: {
				type: String,
				unique: true,
				index: true,
				validate: {
					validator: validateDirectMessageUniqueKey,
					message: 'Invalid direct message unique key.',
				},
			},
		},
		schemaOptions
	)
);

const ChannelGroup = Channel.discriminator(
	ChannelTypeEnum.GROUP,
	new Schema<IChannel>(
		{
			ownerId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: CollectionNamesEnum.USERS,
			},
			name: { type: String, required: true },
		},
		schemaOptions
	)
);

export { Channel, ChannelDirectMessage, ChannelGroup };
