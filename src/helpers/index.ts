import {
	ChannelMemberRoleEnum,
	ChannelMemberStatusEnum,
} from '@src/shared/enums';
import { IPagination } from '@src/shared/types';
import { isEmpty, isString } from 'lodash-es';

/**
 * Checks if the user is a member of the channel.
 *
 * @param {ChannelMemberRoleEnum} params.role
 * @param {ChannelMemberStatusEnum} params.status
 * @return {boolean}
 */
export function isMemberOfChannel(params: {
	role: ChannelMemberRoleEnum;
	status: ChannelMemberStatusEnum;
}): boolean {
	return (
		(params.role === ChannelMemberRoleEnum.OWNER ||
			params.role === ChannelMemberRoleEnum.ADMIN ||
			params.role === ChannelMemberRoleEnum.MEMBER) &&
		params.status === ChannelMemberStatusEnum.ACTIVE
	);
}

/**
 * Checks if the user is the owner of the channel.
 *
 * @param {ChannelMemberRoleEnum} params.role
 * @param {ChannelMemberStatusEnum} params.status
 * @return {boolean}
 */
export function isOwnerOfChannel(params: {
	role: ChannelMemberRoleEnum;
	status: ChannelMemberStatusEnum;
}) {
	return (
		params.role === ChannelMemberRoleEnum.OWNER &&
		params.status === ChannelMemberStatusEnum.ACTIVE
	);
}

/**
 * Checks if the user is an admin of the channel.
 *
 * @param {ChannelMemberRoleEnum} params.role
 * @param {ChannelMemberStatusEnum} params.status
 * @return {boolean}
 */
export function isAdminOfChannel(params: {
	role: ChannelMemberRoleEnum;
	status: ChannelMemberStatusEnum;
}): boolean {
	return (
		params.role === ChannelMemberRoleEnum.ADMIN &&
		params.status === ChannelMemberStatusEnum.ACTIVE
	);
}

/**
 * Gets the pagination for a given page, size per page, and total items.
 *
 * @param {number} params.page
 * @param {number} params.sizePerPage
 * @param {number} params.totalItems
 * @return {IPagination}
 */
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

/**
 * Get possible error message from the error object.
 *
 * @param {any} params.error
 * @return {string}
 */
export function getErrorMessage(params: { error: any }): string {
	const { error } = params;
	let errorMessage = '';

	if (isString(error)) {
		return error;
	}

	errorMessage = isString(error?.message) ? error?.message : '';

	// log if it's an unknown error
	if (isEmpty(errorMessage)) {
		console.error('errorMessage', errorMessage);
	}

	return errorMessage || 'Something went wrong.';
}
