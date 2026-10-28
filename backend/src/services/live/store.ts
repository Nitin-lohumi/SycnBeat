import type { Ability, LiveRoom, PresenceState } from "./types";

const rooms = new Map<string, LiveRoom>();
const userToRoom = new Map<string, string>(); // a user is live in one room at a time

export const getLive = (roomId: string) => rooms.get(roomId);
export const liveRoomIdOf = (userId: string) => userToRoom.get(userId) ?? null;

export function currentLive(userId: string) {
  const roomId = userToRoom.get(userId);
  return roomId ? rooms.get(roomId) : undefined;
}

export function addRoom(room: LiveRoom) {
  rooms.set(room.id, room);
}

export function deleteRoom(roomId: string) {
  rooms.delete(roomId);
}

export function setUserRoom(userId: string, roomId: string) {
  userToRoom.set(userId, roomId);
}

export function clearUserRoom(userId: string, roomId: string) {
  if (userToRoom.get(userId) === roomId) userToRoom.delete(userId);
}

export const adminOf = (room: LiveRoom) =>
  room.listeners.has(room.ownerId) ? room.ownerId : room.tempAdminId;

// The owner is always an admin, even from outside the room.
export const isAdmin = (room: LiveRoom, userId: string) =>
  userId === room.ownerId || userId === room.tempAdminId;

export function can(room: LiveRoom, userId: string, ability: Ability) {
  if (isAdmin(room, userId)) return true;
  return room.listeners.get(userId)?.[ability] ?? false;
}

export function presenceOf(room: LiveRoom): PresenceState {
  return {
    adminId: adminOf(room),
    tempAdminId: room.tempAdminId,
    listeners: [...room.listeners.values()]
      .sort((a, b) => a.joinedAt - b.joinedAt)
      .map((l) => ({
        user: l.user,
        joinedAt: l.joinedAt,
        online: l.sockets.size > 0,
        canQueue: l.canQueue,
        canControl: l.canControl,
      })),
  };
}

// Small card data for the Rooms page.
export function liveSummary(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return null;
  const t = room.playback.track;
  return {
    listenerCount: room.listeners.size,
    listeners: [...room.listeners.values()].slice(0, 5).map((l) => l.user),
    nowPlaying: t ? { title: t.title, artist: t.artist, thumbnailUrl: t.thumbnailUrl } : null,
  };
}

const lastHit = new Map<string, number>();

// True when the same key was used less than `ms` ago (simple spam guard).
export function throttled(key: string, ms: number) {
  const now = Date.now();
  if ((lastHit.get(key) ?? 0) + ms > now) return true;
  lastHit.set(key, now);
  return false;
}
