import type { PublicUser } from "../../types/user";

export type NotificationType =
  | "FRIEND_ACCEPTED"
  | "FRIEND_REMOVED"
  | "YOU_REMOVED_FRIEND"
  | "YOU_ADDED_FRIEND"
  | "ROOM_INVITE"
  | "YOU_LEFT_ROOM"
  | "YOU_WERE_REMOVED_FROM_ROOM";

export type InviteStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "EXPIRED";

export interface AppNotification {
  id: string;
  type: NotificationType;
  readAt: string | null;
  createdAt: string;
  actor: PublicUser;
  room: { id: string; name: string } | null;
  inviteStatus?: InviteStatus | null;
}

export interface Counts {
  friendRequests: number;
  notifications: number;
  messages: number;
}
