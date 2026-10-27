import type { PublicUser } from "../../types/user";

export type RelationStatus = "NONE" | "OUTGOING" | "INCOMING" | "FRIENDS";

export interface SearchUser extends PublicUser {
  status: RelationStatus;
  requestId: string | null;
}

export interface FriendRequest {
  id: string;
  user: PublicUser;
  createdAt: string;
}

export interface FriendRequests {
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}

export interface Friend {
  user: PublicUser;
  since: string;
}

export interface SendRequestResult {
  status: "OUTGOING" | "FRIENDS";
  requestId: string | null;
}
