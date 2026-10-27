import type { PublicUser } from "../../types/user";

export type NotificationType = "FRIEND_ACCEPTED" | "FRIEND_REMOVED";

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
