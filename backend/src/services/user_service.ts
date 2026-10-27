import { prisma } from "../config/prisma";

// Dusre users ka sirf itna data bahar jaata hai — email/googleId kabhi nahi
export const publicUserSelect = {
  id: true,
  name: true,
  username: true,
  avatarUrl: true,
} as const;

export type PublicUser = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
};

export type RelationStatus = "NONE" | "OUTGOING" | "INCOMING" | "FRIENDS";

export async function searchUsers(me: string, q: string) {
  const users = await prisma.user.findMany({
    where: {
      id: { not: me },
      ...(q
        ? {
            OR: [
              { username: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } },
            ],
          }
        : {
            sentFriendRequests: { none: { receiverId: me } },
            receivedFriendRequests: { none: { senderId: me } },
          }),
    },
    select: publicUserSelect,
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  
  const ids = users.map((u) => u.id);
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { senderId: me, receiverId: { in: ids } },
        { receiverId: me, senderId: { in: ids } },
      ],
    },
    select: { id: true, senderId: true, receiverId: true, status: true },
  });

  const byUser = new Map(
    friendships.map((f) => [f.senderId === me ? f.receiverId : f.senderId, f]),
  );

  return users.map((user) => {
    const f = byUser.get(user.id);
    let status: RelationStatus = "NONE";
    if (f?.status === "ACCEPTED") status = "FRIENDS";
    else if (f?.status === "PENDING") status = f.senderId === me ? "OUTGOING" : "INCOMING";
    return { ...user, status, requestId: status === "OUTGOING" || status === "INCOMING" ? f!.id : null };
  });
}
