import type { PublicUser } from "../../types/user";

export type NotificationType =
  | "FRIEND_ACCEPTED"
  | "FRIEND_REMOVED"
  | "YOU_REMOVED_FRIEND"
  | "YOU_ADDED_FRIEND";

export interface AppNotification {
  id: string;
  type: NotificationType;
  readAt: string | null;
  createdAt: string;
  actor: PublicUser;
}

export interface Counts {
  friendRequests: number;
  notifications: number;
}
