import { CollectionNamesEnum, MessageTypeEnum } from '@src/shared/enums';
import { IMessage } from '@src/shared/types';
import mongoose, { Schema, model } from 'mongoose';

const messageSchema = new Schema<IMessage>({
	_id: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		default: () => new mongoose.Types.ObjectId(),
	},
	content: { type: String, required: true },
	// createdAt will be indexed for faster messages querying
	createdAt: {
		type: Date,
		required: true,
		default: () => Date.now(),
		index: true,
	},
	updatedAt: { type: Date },
	deletedAt: { type: Date },
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
	directMessageUniqueKey: { type: String, ref: CollectionNamesEnum.CHANNELS },
	type: { type: String, required: true, enum: MessageTypeEnum },
});

const Message = model<IMessage>(
	CollectionNamesEnum.MESSAGES,
	messageSchema,
	CollectionNamesEnum.MESSAGES
);

export { Message };
