export enum CookieNamesEnum {
	APP_USER_TOKEN_JWT = 'app_user_token_jwt',
}

export enum CollectionNamesEnum {
	MESSAGES = 'Messages',
	CHANNELS = 'Channels',
	CHANNEL_MEMBERS = 'ChannelMembers',
	USERS = 'Users',
}

export enum MessageTypeEnum {
	TEXT = 'text',
	IMAGE = 'image',
	VIDEO = 'video',
	AUDIO = 'audio',
}

export enum ChannelMemberRoleEnum {
	OWNER = 'owner',
	ADMIN = 'admin',
	MEMBER = 'member',
}

export enum ChannelMemberStatusEnum {
	ACTIVE = 'active',
	INACTIVE = 'inactive',
	BANNED = 'banned',
	REMOVED = 'removed',
	PENDING = 'pending',
}

export enum ChannelTypeEnum {
	GROUP = 'group',
	DIRECT_MESSAGE = 'directMessage',
}

export enum SignUpMethodEnum {
	EMAIL = 'email',
	GOOGLE = 'google',
}

export enum WebsocketMessageEventTypeEnum {
	MESSAGE_SENDING = 'message_sending',
	MESSAGE_CREATED = 'message_created',
	MESSAGE_UPDATED = 'message_updated',
	MESSAGE_DELETED = 'message_deleted',
}

export enum WebsocketChannelEventTypeEnum {
	CHANNEL_CREATED = 'channel_created',
	CHANNEL_UPDATED = 'channel_updated',
	CHANNEL_DELETED = 'channel_deleted',
}

export enum WebsocketChannelMemberEventTypeEnum {
	CHANNEL_MEMBER_CREATED = 'channel_member_created',
	CHANNEL_MEMBER_UPDATED = 'channel_member_updated',
	CHANNEL_MEMBER_DELETED = 'channel_member_deleted',
	CHANNEL_MEMBER_JOINED = 'channel_member_joined',
	CHANNEL_MEMBER_LEFT = 'channel_member_left',
}

export type WebSocketEvents =
	| WebsocketMessageEventTypeEnum
	| WebsocketChannelEventTypeEnum
	| WebsocketChannelMemberEventTypeEnum;
