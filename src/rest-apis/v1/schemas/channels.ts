import { FastifySchema } from 'fastify';

export const getUserChannelsSchema: FastifySchema = {
	querystring: {
		type: 'object',
		additionalProperties: false,
		properties: {
			sizePerPage: {
				type: 'number',
				default: 20,
			},
			lastSeenChannelId: {
				type: 'string',
			},
			lastSeenActivityAt: {
				type: 'string',
			},
		},
	},
};

export const getChannelSchema: FastifySchema = {
	params: {
		type: 'object',
		additionalProperties: false,
		properties: {
			channelId: {
				type: 'string',
			},
		},
		required: ['channelId'],
	},
};

export const createChannelSchema: FastifySchema = {
	body: {
		type: 'object',
		additionalProperties: false,
		required: ['name', 'channelType'],
		properties: {
			name: {
				type: 'string',
			},
			channelType: {
				type: 'string',
				enum: ['group', 'directMessage'],
			},
		},
	},
};

export const updateChannelSchema: FastifySchema = {
	body: {
		type: 'object',
		additionalProperties: false,
		properties: {
			name: {
				type: 'string',
			},
			ownerId: {
				type: 'string',
			},
		},
	},
	params: {
		type: 'object',
		additionalProperties: false,
		properties: {
			channelId: {
				type: 'string',
			},
		},
		required: ['channelId'],
	},
};

export const getChannelMembersSchema: FastifySchema = {
	params: {
		type: 'object',
		additionalProperties: false,
		properties: {
			channelId: {
				type: 'string',
			},
		},
		required: ['channelId'],
	},
};
