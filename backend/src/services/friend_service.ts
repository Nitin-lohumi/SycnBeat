import { prisma } from "../config/prisma";
import { emitToUsers } from "../socket";
import { AppError } from "../utils/AppError";
import { isUniqueViolation } from "../utils/prismaErrors";
import { notificationSelect } from "./notification_service";
import { publicUserSelect } from "./user_service";


export function sortPair(a: string, b: string) {
  return a < b ? { userLowId: a, userHighId: b } : { userLowId: b, userHighId: a };
}

export async function listFriends(me: string) {
  const rows = await prisma.friendship.findMany({
    where: { status: "ACCEPTED", OR: [{ senderId: me }, { receiverId: me }] },
    select: {
      updatedAt: true,
      senderId: true,
      sender: { select: publicUserSelect },
      receiver: { select: publicUserSelect },
    },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map((r) => ({
    user: r.senderId === me ? r.receiver : r.sender,
    since: r.updatedAt,
  }));
}

export async function listFriendRequests(me: string) {
  const [incoming, outgoing] = await Promise.all([
    prisma.friendship.findMany({
      where: { receiverId: me, status: "PENDING" },
      select: { id: true, createdAt: true, sender: { select: publicUserSelect } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.friendship.findMany({
      where: { senderId: me, status: "PENDING" },
      select: { id: true, createdAt: true, receiver: { select: publicUserSelect } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return {
    incoming: incoming.map((r) => ({ id: r.id, user: r.sender, createdAt: r.createdAt })),
    outgoing: outgoing.map((r) => ({ id: r.id, user: r.receiver, createdAt: r.createdAt })),
  };
}

export async function sendFriendRequest(me: string, targetId: string) {
  if (me === targetId) throw new AppError(400, "You can't add yourself");

  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
  if (!target) throw new AppError(404, "User not found");

  const pair = sortPair(me, targetId);
  const existing = await prisma.friendship.findUnique({
    where: { userLowId_userHighId: pair },
  });

  if (existing?.status === "ACCEPTED") throw new AppError(409, "Already friends");
  if (existing?.status === "PENDING") {
    if (existing.senderId === me) throw new AppError(409, "Request already sent");
    // Usne mujhe pehle se bheji hui hai -> dono ek dusre ko chahte hain, seedha accept
    await acceptFriendRequest(me, existing.id);
    return { status: "FRIENDS" as const, requestId: null };
  }

  let request;
  try {
    request = await prisma.friendship.create({
      data: { ...pair, senderId: me, receiverId: targetId },
      select: { id: true, createdAt: true, sender: { select: publicUserSelect } },
    });
  } catch (e) {
    // Dono ne ek hi waqt pe bheji -> ek create jeeta, dusra yahan aayega
    if (isUniqueViolation(e)) throw new AppError(409, "Request already exists");
    throw e;
  }

  emitToUsers(targetId, "friend:request:new", {
    id: request.id,
    user: request.sender,
    createdAt: request.createdAt,
  });
  return { status: "OUTGOING" as const, requestId: request.id };
}

export async function acceptFriendRequest(me: string, requestId: string) {
  const request = await prisma.friendship.findUnique({
    where: { id: requestId },
    select: { senderId: true },
  });
  if (!request) throw new AppError(404, "Request not found");

  const notification = await prisma.$transaction(async (tx) => {
    // Conditional update: sirf tab jab abhi bhi PENDING ho aur receiver main hu.
    // Do tabs se ek saath accept kiya to sirf ek ka count 1 aayega -> double notification nahi
    const { count } = await tx.friendship.updateMany({
      where: { id: requestId, receiverId: me, status: "PENDING" },
      data: { status: "ACCEPTED" },
    });
    if (count === 0) throw new AppError(404, "Request not found");

    return tx.notification.create({
      data: { userId: request.senderId, actorId: me, type: "FRIEND_ACCEPTED" },
      select: notificationSelect,
    });
  });

  const both = [me, request.senderId];
  emitToUsers(both, "friend:request:removed", { requestId });
  emitToUsers(both, "friends:changed");
  emitToUsers(request.senderId, "notification:new", notification);
}

// Receiver ke liye "reject", sender ke liye "cancel" — dono mein row delete
export async function removeFriendRequest(me: string, requestId: string) {
  const request = await prisma.friendship.findUnique({
    where: { id: requestId },
    select: { senderId: true, receiverId: true, status: true },
  });
  if (
    !request ||
    request.status !== "PENDING" ||
    (request.senderId !== me && request.receiverId !== me)
  ) {
    throw new AppError(404, "Request not found");
  }

  const { count } = await prisma.friendship.deleteMany({
    where: { id: requestId, status: "PENDING" },
  });
  if (count === 0) throw new AppError(404, "Request not found");

  emitToUsers([request.senderId, request.receiverId], "friend:request:removed", { requestId });
}

export async function removeFriend(me: string, friendId: string) {
  const notification = await prisma.$transaction(async (tx) => {
    const { count } = await tx.friendship.deleteMany({
      where: { ...sortPair(me, friendId), status: "ACCEPTED" },
    });
    if (count === 0) throw new AppError(404, "Not friends");

    return tx.notification.create({
      data: { userId: friendId, actorId: me, type: "FRIEND_REMOVED" },
      select: notificationSelect,
    });
  });

  emitToUsers([me, friendId], "friends:changed");
  emitToUsers(friendId, "notification:new", notification);
}
