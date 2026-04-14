import {
	ChannelMemberRoleEnum,
	ChannelMemberStatusEnum,
} from '@src/shared/enums';

export function isMemberOfChannel(params: {
	role: ChannelMemberRoleEnum;
	status: ChannelMemberStatusEnum;
}) {
	return (
		(params.role === ChannelMemberRoleEnum.OWNER ||
			params.role === ChannelMemberRoleEnum.ADMIN ||
			params.role === ChannelMemberRoleEnum.MEMBER) &&
		params.status === ChannelMemberStatusEnum.ACTIVE
	);
}

export function isOwnerOfChannel(params: {
	role: ChannelMemberRoleEnum;
	status: ChannelMemberStatusEnum;
}) {
	return (
		params.role === ChannelMemberRoleEnum.OWNER &&
		params.status === ChannelMemberStatusEnum.ACTIVE
	);
}

export function isAdminOfChannel(params: {
	role: ChannelMemberRoleEnum;
	status: ChannelMemberStatusEnum;
}) {
	return (
		params.role === ChannelMemberRoleEnum.ADMIN &&
		params.status === ChannelMemberStatusEnum.ACTIVE
	);
}
