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
