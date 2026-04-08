import mongoose from 'mongoose';

enum MessageTypeEnum {
	TEXT = 'text',
	IMAGE = 'image',
	VIDEO = 'video',
	AUDIO = 'audio',
}

interface IMessage {
	_id: mongoose.Schema.Types.ObjectId | string;
	content: string;
	createdAt: Date;
	updatedAt?: Date;
	deletedAt?: Date;
	userId: mongoose.Schema.Types.ObjectId | string;
	type: string;
}

interface IUser {
	_id: mongoose.Schema.Types.ObjectId | string;
	username: string;
	email: string;
	firstName?: string;
	lastName?: string;
	password?: string;
	createdAt: Date;
	updatedAt?: Date;
	deletedAt?: Date;
}

enum SignUpMethodEnum {
	EMAIL = 'email',
	GOOGLE = 'google',
}

export type { IMessage, IUser };

export { MessageTypeEnum, SignUpMethodEnum };
