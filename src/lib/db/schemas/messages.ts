import { IMessage, MessageTypeEnum } from '@/lib/types';
import mongoose, { Schema, model } from 'mongoose';

const messageSchema = new Schema<IMessage>({
	_id: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		default: () => new mongoose.Types.ObjectId(),
	},
	content: { type: String, required: true },
	createdAt: { type: Date, required: true, default: () => Date.now() },
	updatedAt: { type: Date },
	deletedAt: { type: Date },
	userId: { type: mongoose.Schema.Types.ObjectId, required: true },
	type: { type: String, required: true, enum: MessageTypeEnum },
});

const Message = model<IMessage>('Message', messageSchema);

export { Message, type IMessage };
