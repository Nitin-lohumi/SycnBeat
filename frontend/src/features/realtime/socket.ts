import { io, type Socket } from "socket.io-client";
import type { DirectMessage } from "../chat/types";
import type { FriendRequest } from "../friends/types";
import type { AppNotification } from "../notifications/types";
import type {
  AckResult,
  ChatMessage,
  LeaveReason,
  PlaybackState,
  PresenceState,
} from "../rooms/types";


export interface ServerToClientEvents {
  "friend:request:new": (data: FriendRequest) => void;
  "friend:request:removed": (data: { requestId: string }) => void;
  "friends:changed": () => void;
  "notification:new": (data: AppNotification) => void;
  "library:changed": () => void;

  "rooms:changed": () => void;
  "room:left": (data: { roomId: string; reason: LeaveReason }) => void;
  "room:updated": (data: { name: string; description: string | null }) => void;
  "room:presence": (data: PresenceState) => void;
  "room:playback": (data: PlaybackState) => void;
  "room:queue:changed": () => void;
  "room:members:changed": () => void;
  "room:chat": (data: ChatMessage) => void;
  "room:chat:update": (data: ChatMessage) => void;
  "room:typing": (data: { userId: string; isTyping: boolean }) => void;
  "room:reaction": (data: { userId: string; emoji: string }) => void;

  "dm:new": (data: DirectMessage) => void;
  "dm:read": (data: { conversationId: string; readerId: string; readAt: string }) => void;
  "dm:typing": (data: { conversationId: string; userId: string; isTyping: boolean }) => void;
}

type Ack = (res: AckResult) => void;

export interface ClientToServerEvents {
  "time:ping": (ack: (serverNow: number) => void) => void;
  "room:join": (data: { roomId: string }, ack: Ack) => void;
  "room:leave": (data: object, ack: Ack) => void;
  "room:playback": (data: object, ack: Ack) => void;
  "room:chat": (data: { text: string }, ack: Ack) => void;
  "room:typing": (data: { isTyping: boolean }) => void;
  "room:reaction": (data: { emoji: string }) => void;
  "room:request": (data: object, ack: Ack) => void;
  "room:request:resolve": (data: { id: string; approve: boolean }, ack: Ack) => void;
  "dm:typing": (data: { conversationId: string; isTyping: boolean }) => void;
}

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(import.meta.env.VITE_API_URL, {
  withCredentials: true,
  autoConnect: false,
});
