import mongoose, { HydratedDocument } from 'mongoose';
import {
	ChannelMemberRoleEnum,
	ChannelMemberStatusEnum,
	ChannelTypeEnum,
	MessageTypeEnum,
} from '../enums';

export interface IMessage {
	_id: mongoose.Schema.Types.ObjectId | string;
	content: string;
	createdAt: Date;
	updatedAt?: Date;
	deletedAt?: Date;
	userId: mongoose.Schema.Types.ObjectId | string;
	type: MessageTypeEnum;
	channelId: mongoose.Schema.Types.ObjectId | string;
}

export interface IUser {
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

export interface IChannel {
	_id: mongoose.Schema.Types.ObjectId | string;
	createdAt: Date;
	updatedAt?: Date;
	deletedAt?: Date;
	lastActivityAt?: Date;
	ownerId: mongoose.Schema.Types.ObjectId | string;
	name: string;
	channelType: ChannelTypeEnum;
	/**
	 * Direct message unique key.
	 * - key = `${ObjectId.toString()}-${ObjectId.toString()}`
	 */
	directMessageUniqueKey: string;
}

export interface IChannelMember {
	_id: mongoose.Schema.Types.ObjectId | string;
	createdAt: Date;
	updatedAt?: Date;
	deletedAt?: Date;
	role: ChannelMemberRoleEnum;
	status: ChannelMemberStatusEnum;
	userId: mongoose.Schema.Types.ObjectId | string;
	channelId: mongoose.Schema.Types.ObjectId | string;
}

export type ChannelMemberWithUser = HydratedDocument<IChannelMember> & {
	userId: IUser;
};

export type IChannelWithDirectMessageChannelMembers = {
	channel: HydratedDocument<IChannel>;
	directMessageChannelMembers?: ChannelMemberWithUser[] | null | undefined;
};

export interface IPagination {
	page: number;
	sizePerPage: number;
	totalItems: number;
	totalPages: number;
	hasPreviousPage: boolean;
	hasNextPage: boolean;
}

export * from './websocket';
