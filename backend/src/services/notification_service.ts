import { prisma } from "../config/prisma";
import { publicUserSelect } from "./user_service";

export const notificationSelect = {
  id: true,
  type: true,
  readAt: true,
  createdAt: true,
  actor: { select: publicUserSelect },
} as const;

export function listNotifications(me: string) {
  return prisma.notification.findMany({
    where: { userId: me },
    select: notificationSelect,
    orderBy: { createdAt: "desc" },
    take: 30,
  });
}

// Header badges ke liye — page load pe ek baar, phir socket events se update
export async function getCounts(me: string) {
  const [friendRequests, notifications] = await Promise.all([
    prisma.friendship.count({ where: { receiverId: me, status: "PENDING" } }),
    prisma.notification.count({ where: { userId: me, readAt: null } }),
  ]);
  return { friendRequests, notifications };
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
