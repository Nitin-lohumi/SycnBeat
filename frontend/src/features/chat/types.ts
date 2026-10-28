import type { PublicUser } from "../../types/user";

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
  pending?: boolean; // optimistic, not saved yet
}

export interface ConversationSummary {
  id: string;
  user: PublicUser;
  lastMessage: DirectMessage | null;
  lastMessageAt: string | null;
  unread: number;
}

export interface ConversationDetail {
  id: string;
  user: PublicUser;
  isFriend: boolean;
}

export interface MessagePage {
  messages: DirectMessage[];
  nextCursor: string | null;
}
