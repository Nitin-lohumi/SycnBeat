import type { Request, Response } from "express";
import { z } from "zod";
import {
  acceptFriendRequest,
  listFriendRequests,
  listFriends,
  removeFriend,
  removeFriendRequest,
  sendFriendRequest,
} from "../services/friend_service";
import { parse } from "../utils/validate";

const sendBody = z.object({ userId: z.string().min(1) });
const idParam = z.object({ id: z.string().min(1) });
const userIdParam = z.object({ userId: z.string().min(1) });

export async function getFriends(req: Request, res: Response) {
  res.json({ friends: await listFriends(req.userId!) });
}

export async function getRequests(req: Request, res: Response) {
  res.json(await listFriendRequests(req.userId!));
}

export async function sendRequest(req: Request, res: Response) {
  const { userId } = parse(sendBody, req.body, "userId is required");
  res.status(201).json(await sendFriendRequest(req.userId!, userId));
}

export async function acceptRequest(req: Request, res: Response) {
  const { id } = parse(idParam, req.params, "Invalid request id");
  await acceptFriendRequest(req.userId!, id);
  res.status(204).end();
}

export async function deleteRequest(req: Request, res: Response) {
  const { id } = parse(idParam, req.params, "Invalid request id");
  await removeFriendRequest(req.userId!, id);
  res.status(204).end();
}

export async function unfriend(req: Request, res: Response) {
  const { userId } = parse(userIdParam, req.params, "Invalid user id");
  await removeFriend(req.userId!, userId);
  res.status(204).end();
}
