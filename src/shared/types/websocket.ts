import { ChannelMemberWithUser, IChannel, IChannelMember, IMessage } from '.';
import { WebSocketEvents } from '../enums';

export type IChatWebsocketPayload = {
	event: WebSocketEvents;
	message?: Partial<IMessage>;
	channel?: Partial<IChannel>;
	channelMember?: Partial<IChannelMember>;
	directMessageChannelMembers?: ChannelMemberWithUser[] | null | undefined;
	directMessageUniqueKey?: string;
};
