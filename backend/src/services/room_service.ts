import { prisma } from "../config/prisma";
import { emitToLive, emitToUsers } from "../socket";
import { AppError } from "../utils/AppError";
import { areFriends, friendIdsAmong, listFriends } from "./friend_service";
import {
  endLive,
  removeListener,
  signalRoomsChanged,
  updateLiveAbilities,
  updateLiveInfo,
} from "./live/presence";
import { getLive, isAdmin, liveRoomIdOf, liveSummary } from "./live/store";
import type { Ability } from "./live/types";
import { notificationSelect } from "./notification_service";
import { publicUserSelect } from "./user_service";

const membersChanged = (roomId: string) => emitToLive(roomId, "room:members:changed");

const roomCardSelect = {
  id: true,
  name: true,
  description: true,
  coverUrl: true,
  ownerId: true,
  updatedAt: true,
  owner: { select: publicUserSelect },
  _count: { select: { members: true } },
} as const;

async function ownedRoom(me: string, roomId: string) {
  const room = await prisma.room.findUnique({ where: { id: roomId }, select: { id: true, ownerId: true } });
  if (!room) throw new AppError(404, "Room not found");
  if (room.ownerId !== me) throw new AppError(403, "Only the room owner can do this");
  return room;
}

async function assertMember(me: string, roomId: string) {
  const member = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId: me } },
    select: { userId: true },
  });
  if (!member) throw new AppError(404, "Room not found");
}

export async function listRooms(me: string) {
  const rows = await prisma.room.findMany({
    where: { members: { some: { userId: me } } },
    select: roomCardSelect,
    orderBy: { updatedAt: "desc" },
  });

  const cards = rows
    .map(({ _count, ...room }) => {
      const live = liveSummary(room.id);
      return {
        ...room,
        memberCount: _count.members,
        isLive: !!live,
        listenerCount: live?.listenerCount ?? 0,
        listeners: live?.listeners ?? [],
        nowPlaying: live?.nowPlaying ?? null,
      };
    })
    .sort((a, b) => Number(b.isLive) - Number(a.isLive));

  return {
    owned: cards.filter((r) => r.ownerId === me),
    joined: cards.filter((r) => r.ownerId !== me),
    currentRoomId: liveRoomIdOf(me),
  };
}

export async function getRoom(me: string, roomId: string) {
  const room = await prisma.room.findFirst({
    where: { id: roomId, members: { some: { userId: me } } },
    select: {
      id: true,
      name: true,
      description: true,
      coverUrl: true,
      ownerId: true,
      createdAt: true,
      owner: { select: publicUserSelect },
      members: {
        orderBy: { joinedAt: "asc" },
        select: { canQueue: true, canControl: true, joinedAt: true, user: { select: publicUserSelect } },
      },
    },
  });
  if (!room) throw new AppError(404, "Room not found");
  return { ...room, isLive: !!getLive(roomId) };
}

type RoomInput = { name: string; description?: string | null };

// The owner gets a member row too, so "my rooms" and "joined rooms" come from one place.
export async function createRoom(me: string, input: RoomInput) {
  const room = await prisma.room.create({
    data: {
      ownerId: me,
      name: input.name,
      description: input.description ?? null,
      members: { create: { userId: me, canQueue: true, canControl: true } },
    },
    select: { id: true },
  });
  emitToUsers(me, "rooms:changed");
  return getRoom(me, room.id);
}

export async function updateRoom(me: string, roomId: string, input: Partial<RoomInput>) {
  await ownedRoom(me, roomId);
  const room = await prisma.room.update({
    where: { id: roomId },
    data: { name: input.name, description: input.description },
    select: { name: true, description: true },
  });
  updateLiveInfo(roomId, room);
  signalRoomsChanged(roomId);
  return getRoom(me, roomId);
}

export async function deleteRoom(me: string, roomId: string) {
  await ownedRoom(me, roomId);
  const members = await prisma.roomMember.findMany({ where: { roomId }, select: { userId: true } });
  endLive(roomId);
  await prisma.room.delete({ where: { id: roomId } });
  emitToUsers(members.map((m) => m.userId), "rooms:changed");
}

// Friends of mine with their state in this room, for the invite dialog.
export async function invitableFriends(me: string, roomId: string) {
  await assertMember(me, roomId);
  const [friends, members, invites] = await Promise.all([
    listFriends(me),
    prisma.roomMember.findMany({ where: { roomId }, select: { userId: true } }),
    prisma.roomInvite.findMany({ where: { roomId, status: "PENDING" }, select: { receiverId: true } }),
  ]);
  const memberIds = new Set(members.map((m) => m.userId));
  const invitedIds = new Set(invites.map((i) => i.receiverId));

  return friends.map(({ user }) => ({
    user,
    status: memberIds.has(user.id) ? "MEMBER" : invitedIds.has(user.id) ? "INVITED" : "NONE",
  }));
}

export async function inviteFriends(me: string, roomId: string, userIds: string[]) {
  const live = getLive(roomId);
  if (!live) throw new AppError(409, "Start the room before inviting friends");
  if (!isAdmin(live, me)) throw new AppError(403, "Only the admin can invite people");

  const ids = [...new Set(userIds)].filter((id) => id !== me);
  const friendIds = await friendIdsAmong(me, ids);
  const members = await prisma.roomMember.findMany({
    where: { roomId, userId: { in: friendIds } },
    select: { userId: true },
  });
  const memberIds = new Set(members.map((m) => m.userId));
  const targets = friendIds.filter((id) => !memberIds.has(id));
  if (targets.length === 0) throw new AppError(409, "They are already here or not your friends");

  // Re-inviting reuses the row and replaces the old bell notification.
  const notifications = await prisma.$transaction(async (tx) => {
    const created = [];
    for (const receiverId of targets) {
      await tx.roomInvite.upsert({
        where: { roomId_receiverId: { roomId, receiverId } },
        create: { roomId, senderId: me, receiverId },
        update: { senderId: me, status: "PENDING" },
      });
      await tx.notification.deleteMany({ where: { userId: receiverId, roomId, type: "ROOM_INVITE" } });
      const n = await tx.notification.create({
        data: { userId: receiverId, actorId: me, roomId, type: "ROOM_INVITE" },
        select: notificationSelect,
      });
      created.push({ receiverId, n });
    }
    return created;
  });

  for (const { receiverId, n } of notifications) {
    emitToUsers(receiverId, "notification:new", { ...n, inviteStatus: "PENDING" });
  }
  return { invited: targets.length };
}

const markInviteRead = (me: string, roomId: string) =>
  prisma.notification.updateMany({
    where: { userId: me, roomId, type: "ROOM_INVITE", readAt: null },
    data: { readAt: new Date() },
  });

export async function acceptInvite(me: string, roomId: string) {
  const invite = await prisma.roomInvite.findUnique({
    where: { roomId_receiverId: { roomId, receiverId: me } },
    select: { id: true, senderId: true, status: true },
  });
  if (!invite || invite.status !== "PENDING") throw new AppError(404, "This invite is no longer valid");

  if (!getLive(roomId)) {
    await prisma.roomInvite.update({ where: { id: invite.id }, data: { status: "EXPIRED" } });
    throw new AppError(410, "This room is no longer live");
  }
  if (!(await areFriends(me, invite.senderId))) {
    throw new AppError(403, "You are no longer friends with the person who invited you");
  }

  await prisma.$transaction(async (tx) => {
    const { count } = await tx.roomInvite.updateMany({
      where: { id: invite.id, status: "PENDING" },
      data: { status: "ACCEPTED" },
    });
    if (count === 0) throw new AppError(404, "This invite is no longer valid");
    await tx.roomMember.upsert({
      where: { roomId_userId: { roomId, userId: me } },
      create: { roomId, userId: me },
      update: {},
    });
  });
  await markInviteRead(me, roomId);

  emitToUsers(me, "rooms:changed");
  membersChanged(roomId);
  signalRoomsChanged(roomId);
  return { roomId };
}

export async function declineInvite(me: string, roomId: string) {
  const { count } = await prisma.roomInvite.updateMany({
    where: { roomId, receiverId: me, status: "PENDING" },
    data: { status: "REJECTED" },
  });
  if (count === 0) throw new AppError(404, "This invite is no longer valid");
  await markInviteRead(me, roomId);
}

// Also used when the owner approves an ability request inside the room.
export async function applyAbilities(roomId: string, userId: string, data: Partial<Record<Ability, boolean>>) {
  const { count } = await prisma.roomMember.updateMany({ where: { roomId, userId }, data });
  if (count === 0) throw new AppError(404, "Member not found");
  updateLiveAbilities(roomId, userId, data);
  membersChanged(roomId);
}

export async function setAbilities(
  me: string,
  roomId: string,
  userId: string,
  data: Partial<Record<Ability, boolean>>,
) {
  const room = await ownedRoom(me, roomId);
  if (userId === room.ownerId) throw new AppError(400, "The owner always has every ability");
  await applyAbilities(roomId, userId, data);
}

export async function kickMember(me: string, roomId: string, userId: string) {
  const room = await ownedRoom(me, roomId);
  if (userId === room.ownerId) throw new AppError(400, "You can't remove yourself");

  const notification = await prisma.$transaction(async (tx) => {
    const { count } = await tx.roomMember.deleteMany({ where: { roomId, userId } });
    if (count === 0) throw new AppError(404, "Member not found");
    await tx.roomInvite.updateMany({ where: { roomId, receiverId: userId }, data: { status: "CANCELLED" } });
    return tx.notification.create({
      data: { userId, actorId: me, roomId, type: "YOU_WERE_REMOVED_FROM_ROOM", readAt: new Date() },
      select: notificationSelect,
    });
  });

  removeListener(roomId, userId, "kicked");
  emitToUsers(userId, "notification:new", notification);
  emitToUsers(userId, "rooms:changed");
  membersChanged(roomId);
  signalRoomsChanged(roomId);
}

// "Remove" on the Rooms page: a member drops a room they joined.
export async function removeMembership(me: string, roomId: string) {
  const room = await prisma.room.findUnique({ where: { id: roomId }, select: { ownerId: true } });
  if (!room) throw new AppError(404, "Room not found");
  if (room.ownerId === me) throw new AppError(400, "You own this room, delete it instead");

  const { count } = await prisma.roomMember.deleteMany({ where: { roomId, userId: me } });
  if (count === 0) throw new AppError(404, "Room not found");

  removeListener(roomId, me, "removed");
  emitToUsers(me, "rooms:changed");
  membersChanged(roomId);
  signalRoomsChanged(roomId);
}

// After unfriending, neither stays in the other's rooms.
export async function dropSharedRooms(a: string, b: string) {
  const rows = await prisma.roomMember.findMany({
    where: {
      OR: [
        { userId: b, room: { ownerId: a } },
        { userId: a, room: { ownerId: b } },
      ],
    },
    select: { roomId: true, userId: true },
  });
  if (rows.length === 0) return;

  await prisma.roomMember.deleteMany({
    where: { OR: rows.map(({ roomId, userId }) => ({ roomId, userId })) },
  });
  for (const { roomId, userId } of rows) {
    removeListener(roomId, userId, "removed");
    membersChanged(roomId);
    signalRoomsChanged(roomId);
  }
  emitToUsers([a, b], "rooms:changed");
}
