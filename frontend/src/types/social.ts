import type { User } from "./user";

// List/card mein poora User nahi chahiye, itna kaafi hai
export type PublicUser = Pick<User, "id" | "name" | "username" | "avatarUrl">;

export interface FriendRequest {
  id: string;
  from: PublicUser;
  createdAt: string;
}

export type AppNotification =
  | { id: string; type: "FRIEND_ACCEPTED"; actor: PublicUser; createdAt: string; read: boolean }
  | {
      id: string;
      type: "ROOM_INVITE";
      actor: PublicUser;
      room: { id: string; name: string };
      createdAt: string;
      read: boolean;
    };
