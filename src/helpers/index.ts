import {
	ChannelMemberRoleEnum,
	ChannelMemberStatusEnum,
	WebsocketChannelEventTypeEnum,
	WebsocketChannelMemberEventTypeEnum,
	WebsocketMessageEventTypeEnum,
} from '@src/shared/enums';
import { IPagination } from '@src/shared/types';
import { isEmpty, isString } from 'lodash-es';
import { isValidObjectId, ObjectId } from 'mongoose';

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

/**
 * Get direct message unique key.
 *
 * @param {(string | ObjectId)[]} ids
 * @return {string}
 */
export function getDirectMessageUniqueKey(
	ids: [string | ObjectId, string | ObjectId]
): string {
	if (ids.length !== 2 || !Array.isArray(ids)) {
		throw new Error('getDirectMessageUniqueKey() ids must be of length 2.');
	}

	const id1 = ids[0];
	const id2 = ids[1];

	if (!isValidObjectId(id1) || !isValidObjectId(id2)) {
		throw new Error('getDirectMessageUniqueKey() Invalid objectId');
	}

	return [id1.toString(), id2.toString()].sort().join('-');
}

/**
 * Validates the direct message unique key.
 *
 * @param {string} directMessageUniqueKey
 * @return {boolean}
 */
export function validateDirectMessageUniqueKey(
	directMessageUniqueKey: string
): boolean {
	if (isEmpty(directMessageUniqueKey) || !isString(directMessageUniqueKey)) {
		return false;
	}

	const directMessageUniqueKeyArray = directMessageUniqueKey.split('-');

	if (directMessageUniqueKeyArray.length !== 2) {
		return false;
	}

	const userId1 = directMessageUniqueKeyArray[0];
	const userId2 = directMessageUniqueKeyArray[1];

	if (!isValidObjectId(userId1) || !isValidObjectId(userId2)) {
		return false;
	}

	return true;
}

export function getWebsocketEventType(event: string) {
	const eventType = {
		isMessageEvent: false,
		isChannelEvent: false,
		isChannelMemberEvent: false,
	};

	if (
		event === WebsocketMessageEventTypeEnum.MESSAGE_CREATED ||
		event === WebsocketMessageEventTypeEnum.MESSAGE_UPDATED ||
		event === WebsocketMessageEventTypeEnum.MESSAGE_DELETED
	) {
		eventType.isMessageEvent = true;
	}

	if (
		event === WebsocketChannelEventTypeEnum.CHANNEL_CREATED ||
		event === WebsocketChannelEventTypeEnum.CHANNEL_UPDATED ||
		event === WebsocketChannelEventTypeEnum.CHANNEL_DELETED
	) {
		eventType.isChannelEvent = true;
	}

	if (
		event === WebsocketChannelMemberEventTypeEnum.CHANNEL_MEMBER_CREATED ||
		event === WebsocketChannelMemberEventTypeEnum.CHANNEL_MEMBER_UPDATED ||
		event === WebsocketChannelMemberEventTypeEnum.CHANNEL_MEMBER_DELETED ||
		event === WebsocketChannelMemberEventTypeEnum.CHANNEL_MEMBER_JOINED ||
		event === WebsocketChannelMemberEventTypeEnum.CHANNEL_MEMBER_LEFT
	) {
		eventType.isChannelMemberEvent = true;
	}

	return eventType;
}
