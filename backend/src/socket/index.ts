import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { env } from "../config/env";
import { ACCESS_COOKIE, REFRESH_COOKIE, userIdFromTokens } from "../utils/jwt";
import type { PublicUser } from "../services/user_service";


export interface ServerToClientEvents {
  "friend:request:new": (data: { id: string; user: PublicUser; createdAt: Date }) => void;
  "friend:request:removed": (data: { requestId: string }) => void;
  "friends:changed": () => void;
  "notification:new": (data: { id: string; type: string; actor: PublicUser; createdAt: Date }) => void;
  "library:changed": () => void;
}

type ClientToServerEvents = Record<string, never>;

interface SocketData {
  userId: string;
}

let io: Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData> | undefined;

export const userRoom = (userId: string) => `user:${userId}`;

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
  });
}

export function emitToUsers<E extends keyof ServerToClientEvents>(
  userIds: string | string[],
  event: E,
  ...args: Parameters<ServerToClientEvents[E]>
) {
  if (!io) return;
  const rooms = (Array.isArray(userIds) ? userIds : [userIds]).map(userRoom);
  io.to(rooms).emit(event, ...args);
}
