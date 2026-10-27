import { io, type Socket } from "socket.io-client";
import type { FriendRequest } from "../friends/types";
import type { AppNotification } from "../notifications/types";


export interface ServerToClientEvents {
  "friend:request:new": (data: FriendRequest) => void;
  "friend:request:removed": (data: { requestId: string }) => void;
  "friends:changed": () => void;
  "notification:new": (data: AppNotification) => void;
  "library:changed": () => void;
}

export const socket: Socket<ServerToClientEvents> = io(import.meta.env.VITE_API_URL, {
  withCredentials: true,
  autoConnect: false,
});
