import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { env } from "../config/env";
import { ACCESS_COOKIE, REFRESH_COOKIE, userIdFromTokens } from "../utils/jwt";
import type { PublicUser } from "../services/user_service";
import type { NotificationPayload } from "../services/notification_service";
import type {
  ChatMessage,
  PlaybackState,
  PresenceState,
} from "../services/live/types";
import type { DirectMessagePayload } from "../services/chat_service";
import { registerChatHandlers } from "./chat_handlers";
import { registerRoomHandlers } from "./room_handlers";


export interface ServerToClientEvents {
  "friend:request:new": (data: { id: string; user: PublicUser; createdAt: Date }) => void;
  "friend:request:removed": (data: { requestId: string }) => void;
  "friends:changed": () => void;
  "notification:new": (data: NotificationPayload) => void;
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

  "dm:new": (data: DirectMessagePayload) => void;
  "dm:read": (data: { conversationId: string; readerId: string; readAt: Date }) => void;
  "dm:typing": (data: { conversationId: string; userId: string; isTyping: boolean }) => void;
}

export type LeaveReason = "left" | "disconnected" | "kicked" | "removed" | "ended";

export type AckResult =
  | ({ ok: true } & Record<string, unknown>)
  | { ok: false; error: string; code?: string; retryIn?: number };
export type Ack = (res: AckResult) => void;

// Payloads are `unknown` on purpose: everything from the client is validated with zod.
export interface ClientToServerEvents {
  "time:ping": (ack: (serverNow: number) => void) => void;
  "room:join": (data: unknown, ack?: Ack) => void;
  "room:leave": (data: unknown, ack?: Ack) => void;
  "room:playback": (data: unknown, ack?: Ack) => void;
  "room:chat": (data: unknown, ack?: Ack) => void;
  "room:typing": (data: unknown) => void;
  "room:reaction": (data: unknown) => void;
  "room:request": (data: unknown, ack?: Ack) => void;
  "room:request:resolve": (data: unknown, ack?: Ack) => void;
  "dm:typing": (data: unknown) => void;
}

interface SocketData {
  userId: string;
}

type IO = Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;
export type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;

let io: IO | undefined;

export const userRoom = (userId: string) => `user:${userId}`;
export const liveRoom = (roomId: string) => `live:${roomId}`;

function parseCookies(header = "") {
  const cookies: Record<string, string> = {};
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    cookies[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return cookies;
}

export function initSocket(server: HttpServer) {
  io = new Server(server, {
    cors: { origin: env.CLIENT_URL, credentials: true },
  });

  io.use((socket, next) => {
    const cookies = parseCookies(socket.handshake.headers.cookie);
    const userId = userIdFromTokens(cookies[ACCESS_COOKIE], cookies[REFRESH_COOKIE]);
    if (!userId) return next(new Error("UNAUTHORIZED"));
    socket.data.userId = userId;
    next();
  });

  io.on("connection", (socket) => {
    socket.join(userRoom(socket.data.userId));
    registerRoomHandlers(socket);
    registerChatHandlers(socket);
  });
}

export function emitToUsers<E extends keyof ServerToClientEvents>(
  userIds: string | string[],
  event: E,
  ...args: Parameters<ServerToClientEvents[E]>
) {
  if (!io) return;
  const rooms = (Array.isArray(userIds) ? userIds : [userIds]).map(userRoom);
  if (rooms.length === 0) return;
  io.to(rooms).emit(event, ...args);
}

export function emitToLive<E extends keyof ServerToClientEvents>(
  roomId: string,
  event: E,
  ...args: Parameters<ServerToClientEvents[E]>
) {
  io?.to(liveRoom(roomId)).emit(event, ...args);
}

// Pulls every tab of this user out of the live room's broadcast channel.
export function detachUser(userId: string, roomId: string) {
  io?.in(userRoom(userId)).socketsLeave(liveRoom(roomId));
}
