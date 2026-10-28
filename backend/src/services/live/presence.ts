import { prisma } from "../../config/prisma";
import type { NotificationType } from "../../generated/prisma/client";
import {
  detachUser,
  emitToLive,
  emitToUsers,
  liveRoom,
  type AppSocket,
  type LeaveReason,
} from "../../socket";
import { notificationSelect } from "../notification_service";
import { publicUserSelect } from "../user_service";
import { systemMessage } from "./chat";
import { emptyPlayback, stopPlayback } from "./playback";
import {
  addRoom,
  clearUserRoom,
  currentLive,
  deleteRoom,
  getLive,
  liveRoomIdOf,
  presenceOf,
  setUserRoom,
} from "./store";
import { LiveError, type Ability, type LiveRoom, type RoomSnapshot } from "./types";

// Covers refreshes and short network drops before someone counts as "left".
const GRACE_MS = 20_000;

const writes = new Map<string, Promise<unknown>>();

// DB writes for one room run in order, so a quick offline -> live can't land backwards.
function persist(roomId: string, write: () => Promise<unknown>) {
  const next = (writes.get(roomId) ?? Promise.resolve())
    .then(write)
    .catch((e) => console.error("[room] failed to save live state", e));
  writes.set(roomId, next);
  void next.then(() => {
    if (writes.get(roomId) === next) writes.delete(roomId);
  });
}

const signalTimers = new Map<string, NodeJS.Timeout>();

// Tells every member to refresh their Rooms page (batched, joins/leaves can be bursty).
export function signalRoomsChanged(roomId: string) {
  if (signalTimers.has(roomId)) return;
  signalTimers.set(
    roomId,
    setTimeout(async () => {
      signalTimers.delete(roomId);
      try {
        const members = await prisma.roomMember.findMany({ where: { roomId }, select: { userId: true } });
        emitToUsers(members.map((m) => m.userId), "rooms:changed");
      } catch (e) {
        console.error("[room] rooms:changed failed", e);
      }
    }, 500),
  );
}

const broadcastPresence = (room: LiveRoom) => emitToLive(room.id, "room:presence", presenceOf(room));

function snapshot(room: LiveRoom): RoomSnapshot {
  return {
    room: { id: room.id, name: room.name, description: room.description, ownerId: room.ownerId },
    presence: presenceOf(room),
    playback: room.playback,
    chat: room.chat,
    serverNow: Date.now(),
  };
}

function notifySelf(room: LiveRoom, userId: string, type: NotificationType) {
  prisma.notification
    .create({
      data: { userId, actorId: room.ownerId, type, roomId: room.id, readAt: new Date() },
      select: notificationSelect,
    })
    .then((n) => emitToUsers(userId, "notification:new", n))
    .catch((e) => console.error("[room] notification failed", e));
}

function goLive(info: RoomSnapshot["room"]) {
  const room: LiveRoom = {
    ...info,
    listeners: new Map(),
    tempAdminId: null,
    playback: emptyPlayback(),
    chat: [],
  };
  addRoom(room);
  persist(room.id, () =>
    prisma.room.update({ where: { id: room.id }, data: { isLive: true, liveAt: new Date() } }),
  );
  return room;
}

// Chat and playback die with the room; the queue stays in the DB.
function goOffline(room: LiveRoom) {
  stopPlayback(room);
  deleteRoom(room.id);
  persist(room.id, () =>
    prisma.$transaction([
      prisma.room.update({ where: { id: room.id }, data: { isLive: false } }),
      prisma.roomInvite.updateMany({
        where: { roomId: room.id, status: "PENDING" },
        data: { status: "EXPIRED" },
      }),
    ]),
  );
  signalRoomsChanged(room.id);
}

// Earliest joiner who is still connected; falls back to anyone left.
function pickTempAdmin(room: LiveRoom) {
  if (room.listeners.has(room.ownerId)) {
    room.tempAdminId = null;
    return;
  }
  const [next] = [...room.listeners.values()].sort(
    (a, b) => Number(b.sockets.size > 0) - Number(a.sockets.size > 0) || a.joinedAt - b.joinedAt,
  );
  room.tempAdminId = next?.user.id ?? null;
  if (next) systemMessage(room, `${next.user.name} is now the admin`, { event: "admin", userId: next.user.id });
}

export async function joinRoom(socket: AppSocket, roomId: string) {
  const me = socket.data.userId;
  const member = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId: me } },
    select: {
      canQueue: true,
      canControl: true,
      user: { select: publicUserSelect },
      room: { select: { id: true, name: true, description: true, ownerId: true } },
    },
  });
  if (!member) throw new LiveError(404, "Room not found");

  let room = getLive(roomId);
  if (!room) {
    if (member.room.ownerId !== me) throw new LiveError(409, "Waiting for the owner to start this room");
    room = goLive(member.room);
  }

  const previous = liveRoomIdOf(me);
  if (previous && previous !== roomId) removeListener(previous, me, "left");

  let listener = room.listeners.get(me);
  const isNew = !listener;
  if (!listener) {
    listener = {
      user: member.user,
      joinedAt: Date.now(),
      sockets: new Set(),
      canQueue: member.canQueue,
      canControl: member.canControl,
    };
    room.listeners.set(me, listener);
  }
  clearTimeout(listener.graceTimer);
  listener.graceTimer = undefined;
  listener.sockets.add(socket.id);
  setUserRoom(me, roomId);
  socket.join(liveRoom(roomId));

  if (isNew) {
    if (me === room.ownerId && room.tempAdminId) {
      room.tempAdminId = null;
      systemMessage(room, `${member.user.name} is back as admin`, { event: "back", userId: me });
    } else {
      systemMessage(room, `${member.user.name} joined`, { event: "joined", userId: me });
    }
    signalRoomsChanged(roomId);
  }
  broadcastPresence(room);
  return snapshot(room);
}

export function removeListener(roomId: string, userId: string, reason: LeaveReason) {
  const room = getLive(roomId);
  const listener = room?.listeners.get(userId);
  if (!room || !listener) return;

  clearTimeout(listener.graceTimer);
  room.listeners.delete(userId);
  clearUserRoom(userId, roomId);
  detachUser(userId, roomId);
  emitToUsers(userId, "room:left", { roomId, reason });
  if (reason === "left" || reason === "disconnected") notifySelf(room, userId, "YOU_LEFT_ROOM");

  if (room.listeners.size === 0) return goOffline(room);

  const kicked = reason === "kicked";
  systemMessage(room, kicked ? `${listener.user.name} was removed` : `${listener.user.name} left`, {
    event: kicked ? "removed" : "left",
    userId,
  });
  if (userId === room.ownerId || userId === room.tempAdminId) pickTempAdmin(room);
  broadcastPresence(room);
  signalRoomsChanged(roomId);
}

export function leaveRoom(userId: string) {
  const roomId = liveRoomIdOf(userId);
  if (roomId) removeListener(roomId, userId, "left");
}

export function onDisconnect(socket: AppSocket) {
  const me = socket.data.userId;
  const room = currentLive(me);
  const listener = room?.listeners.get(me);
  if (!room || !listener || !listener.sockets.delete(socket.id)) return;
  if (listener.sockets.size > 0) return;

  broadcastPresence(room);
  listener.graceTimer = setTimeout(() => removeListener(room.id, me, "disconnected"), GRACE_MS);
}

// Room deleted: everyone is sent out, nothing is saved.
export function endLive(roomId: string) {
  const room = getLive(roomId);
  if (!room) return;
  stopPlayback(room);
  deleteRoom(roomId);
  for (const [userId, listener] of room.listeners) {
    clearTimeout(listener.graceTimer);
    clearUserRoom(userId, roomId);
    detachUser(userId, roomId);
    emitToUsers(userId, "room:left", { roomId, reason: "ended" });
  }
}

export function updateLiveAbilities(roomId: string, userId: string, data: Partial<Record<Ability, boolean>>) {
  const room = getLive(roomId);
  const listener = room?.listeners.get(userId);
  if (!room || !listener) return;
  if (data.canQueue !== undefined) listener.canQueue = data.canQueue;
  if (data.canControl !== undefined) listener.canControl = data.canControl;
  broadcastPresence(room);
}

export function updateLiveInfo(roomId: string, info: { name: string; description: string | null }) {
  const room = getLive(roomId);
  if (!room) return;
  room.name = info.name;
  room.description = info.description;
  emitToLive(roomId, "room:updated", info);
}

// Memory is empty after a restart, so nothing can really be live.
export async function resetLiveRooms() {
  await prisma.$transaction([
    prisma.room.updateMany({ where: { isLive: true }, data: { isLive: false } }),
    prisma.roomInvite.updateMany({ where: { status: "PENDING" }, data: { status: "EXPIRED" } }),
  ]);
}
