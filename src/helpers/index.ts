import {
	ChannelMemberRoleEnum,
	ChannelMemberStatusEnum,
} from '@src/shared/enums';
import { IPagination } from '@src/shared/types';

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

export function getPagination(params: {
	page: number;
	sizePerPage: number;
	totalItems: number;
}): IPagination {
	const { page, sizePerPage, totalItems } = params;
	const totalPages = Math.ceil(totalItems / sizePerPage);
	const hasPreviousPage = page > 1;
	const hasNextPage = page < totalPages;

	return {
		page,
		sizePerPage,
		totalItems,
		totalPages,
		hasPreviousPage,
		hasNextPage,
	};
}
