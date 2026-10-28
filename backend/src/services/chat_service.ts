import { prisma } from "../config/prisma";
import { emitToUsers } from "../socket";
import { AppError } from "../utils/AppError";
import { TtlCache } from "../utils/ttlCache";
import { areFriends, sortPair } from "./friend_service";
import { publicUserSelect, type PublicUser } from "./user_service";

export const messageSelect = {
  id: true,
  conversationId: true,
  senderId: true,
  content: true,
  readAt: true,
  createdAt: true,
} as const;

export type DirectMessagePayload = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readAt: Date | null;
  createdAt: Date;
};

const mine = (me: string) => ({ OR: [{ userAId: me }, { userBId: me }] });

const conversationSelect = {
  id: true,
  userAId: true,
  lastMessageAt: true,
  userA: { select: publicUserSelect },
  userB: { select: publicUserSelect },
} as const;

const otherOf = (me: string, c: { userAId: string; userA: PublicUser; userB: PublicUser }) =>
  c.userAId === me ? c.userB : c.userA;

// conversationId -> both user ids; typing events are frequent, so skip the DB most of the time.
const members = new TtlCache<[string, string]>(10 * 60_000, 5000);

async function membersOf(me: string, id: string) {
  let pair = members.get(id);
  if (!pair) {
    const c = await prisma.conversation.findUnique({ where: { id }, select: { userAId: true, userBId: true } });
    if (!c) throw new AppError(404, "Chat not found");
    pair = [c.userAId, c.userBId];
    members.set(id, pair);
  }
  if (!pair.includes(me)) throw new AppError(404, "Chat not found");
  return { me, other: pair[0] === me ? pair[1] : pair[0] };
}

export async function listConversations(me: string) {
  const rows = await prisma.conversation.findMany({
    where: { ...mine(me), lastMessageAt: { not: null } },
    orderBy: { lastMessageAt: "desc" },
    select: {
      ...conversationSelect,
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: messageSelect },
    },
  });

  const unread = await prisma.directMessage.groupBy({
    by: ["conversationId"],
    where: { conversationId: { in: rows.map((r) => r.id) }, senderId: { not: me }, readAt: null },
    _count: { _all: true },
  });
  const unreadBy = new Map(unread.map((u) => [u.conversationId, u._count._all]));

  return rows.map((c) => ({
    id: c.id,
    user: otherOf(me, c),
    lastMessage: c.messages[0] ?? null,
    lastMessageAt: c.lastMessageAt,
    unread: unreadBy.get(c.id) ?? 0,
  }));
}

// Chat is only for friends; the row is created the first time either of them opens it.
export async function openConversation(me: string, userId: string) {
  if (me === userId) throw new AppError(400, "You can't chat with yourself");
  if (!(await areFriends(me, userId))) throw new AppError(403, "You can only chat with friends");

  const { userLowId, userHighId } = sortPair(me, userId);
  const c = await prisma.conversation.upsert({
    where: { userAId_userBId: { userAId: userLowId, userBId: userHighId } },
    create: { userAId: userLowId, userBId: userHighId },
    update: {},
    select: { id: true },
  });
  return { id: c.id };
}

export async function getConversation(me: string, id: string) {
  const c = await prisma.conversation.findFirst({ where: { id, ...mine(me) }, select: conversationSelect });
  if (!c) throw new AppError(404, "Chat not found");
  const user = otherOf(me, c);
  return { id: c.id, user, isFriend: await areFriends(me, user.id) };
}

// Newest page first; `before` is the id of the oldest message already on screen.
export async function listMessages(me: string, id: string, before: string | undefined, limit: number) {
  await membersOf(me, id);
  const rows = await prisma.directMessage.findMany({
    where: { conversationId: id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(before ? { cursor: { id: before }, skip: 1 } : {}),
    select: messageSelect,
  });
  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  return { messages: page.reverse(), nextCursor: hasMore ? page[0].id : null };
}

export async function sendMessage(me: string, id: string, content: string) {
  const { other } = await membersOf(me, id);
  if (!(await areFriends(me, other))) throw new AppError(403, "You can only message friends");

  const message = await prisma.$transaction(async (tx) => {
    const m = await tx.directMessage.create({ data: { conversationId: id, senderId: me, content }, select: messageSelect });
    await tx.conversation.update({ where: { id }, data: { lastMessageAt: m.createdAt } });
    return m;
  });

  emitToUsers([me, other], "dm:new", message);
  return message;
}

export async function markConversationRead(me: string, id: string) {
  const { other } = await membersOf(me, id);
  const readAt = new Date();
  const { count } = await prisma.directMessage.updateMany({
    where: { conversationId: id, senderId: other, readAt: null },
    data: { readAt },
  });
  if (count === 0) return;
  // Both sides: the sender sees "Seen", my other tabs clear their unread badge.
  emitToUsers([me, other], "dm:read", { conversationId: id, readerId: me, readAt });
}

export function unreadMessages(me: string) {
  return prisma.directMessage.count({
    where: { senderId: { not: me }, readAt: null, conversation: mine(me) },
  });
}

export async function relayTyping(me: string, conversationId: string, isTyping: boolean) {
  const { other } = await membersOf(me, conversationId);
  emitToUsers(other, "dm:typing", { conversationId, userId: me, isTyping });
}
