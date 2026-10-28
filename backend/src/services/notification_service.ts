import { prisma } from "../config/prisma";
import type { InviteStatus, NotificationType } from "../generated/prisma/client";
import { unreadMessages } from "./chat_service";
import { publicUserSelect, type PublicUser } from "./user_service";

export const notificationSelect = {
  id: true,
  type: true,
  readAt: true,
  createdAt: true,
  actor: { select: publicUserSelect },
  room: { select: { id: true, name: true } },
} as const;

export type NotificationPayload = {
  id: string;
  type: NotificationType;
  readAt: Date | null;
  createdAt: Date;
  actor: PublicUser;
  room: { id: string; name: string } | null;
  inviteStatus?: InviteStatus | null; // only for ROOM_INVITE, drives the Join / Decline buttons
};

export async function listNotifications(me: string): Promise<NotificationPayload[]> {
  const rows = await prisma.notification.findMany({
    where: { userId: me },
    select: notificationSelect,
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const roomIds = rows.filter((n) => n.type === "ROOM_INVITE" && n.room).map((n) => n.room!.id);
  const invites = roomIds.length
    ? await prisma.roomInvite.findMany({
        where: { receiverId: me, roomId: { in: roomIds } },
        select: { roomId: true, status: true },
      })
    : [];
  const status = new Map(invites.map((i) => [i.roomId, i.status]));

  return rows.map((n) => ({
    ...n,
    inviteStatus: n.type === "ROOM_INVITE" && n.room ? (status.get(n.room.id) ?? null) : null,
  }));
}

// Header badges ke liye — page load pe ek baar, phir socket events se update
export async function getCounts(me: string) {
  const [friendRequests, notifications, messages] = await Promise.all([
    prisma.friendship.count({ where: { receiverId: me, status: "PENDING" } }),
    prisma.notification.count({ where: { userId: me, readAt: null } }),
    unreadMessages(me),
  ]);
  return { friendRequests, notifications, messages };
}

export async function markRead(me: string, id: string) {
  // where mein userId bhi -> koi dusre ki notification read nahi kar sakta
  await prisma.notification.updateMany({
    where: { id, userId: me, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markAllRead(me: string) {
  await prisma.notification.updateMany({
    where: { userId: me, readAt: null },
    data: { readAt: new Date() },
  });
}
