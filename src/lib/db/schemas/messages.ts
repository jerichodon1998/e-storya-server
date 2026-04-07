import mongoose, { Schema, model } from 'mongoose';

enum MessageTypeEnum {
	TEXT = 'text',
	IMAGE = 'image',
	VIDEO = 'video',
	AUDIO = 'audio',
}

interface IMessage {
	_id: mongoose.Schema.Types.ObjectId;
	content: string;
	createdAt: Date;
	updatedAt?: Date;
	deletedAt?: Date;
	userId: mongoose.Schema.Types.ObjectId;
	type: string;
}

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

export { Message, type IMessage, MessageTypeEnum };
