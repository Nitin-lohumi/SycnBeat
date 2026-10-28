import type { Request, Response } from "express";
import {
  acceptInvite,
  createRoom,
  declineInvite,
  deleteRoom,
  getRoom,
  invitableFriends,
  inviteFriends,
  kickMember,
  listRooms,
  removeMembership,
  setAbilities,
  updateRoom,
} from "../services/room_service";
import { addToQueue, listQueue, removeFromQueue, reorderQueue } from "../services/room_queue_service";
import { parse } from "../utils/validate";
import { trackRefSchema } from "../validators/music";
import {
  abilitiesSchema,
  addTracksSchema,
  createRoomSchema,
  inviteSchema,
  memberParamSchema,
  reorderSchema,
  roomIdSchema,
  updateRoomSchema,
} from "../validators/room";

const roomId = (req: Request) => parse(roomIdSchema, req.params, "Invalid room id").id;
const member = (req: Request) => parse(memberParamSchema, req.params, "Invalid member");

export async function getAll(req: Request, res: Response) {
  res.json(await listRooms(req.userId!));
}

export async function getOne(req: Request, res: Response) {
  res.json({ room: await getRoom(req.userId!, roomId(req)) });
}

export async function create(req: Request, res: Response) {
  const body = parse(createRoomSchema, req.body, "Invalid room data");
  res.status(201).json({ room: await createRoom(req.userId!, body) });
}

export async function update(req: Request, res: Response) {
  const body = parse(updateRoomSchema, req.body, "Invalid room data");
  res.json({ room: await updateRoom(req.userId!, roomId(req), body) });
}

export async function remove(req: Request, res: Response) {
  await deleteRoom(req.userId!, roomId(req));
  res.status(204).end();
}

export async function invitable(req: Request, res: Response) {
  res.json({ friends: await invitableFriends(req.userId!, roomId(req)) });
}

export async function invite(req: Request, res: Response) {
  const { userIds } = parse(inviteSchema, req.body, "Pick at least one friend");
  res.status(201).json(await inviteFriends(req.userId!, roomId(req), userIds));
}

export async function accept(req: Request, res: Response) {
  res.json(await acceptInvite(req.userId!, roomId(req)));
}

export async function decline(req: Request, res: Response) {
  await declineInvite(req.userId!, roomId(req));
  res.status(204).end();
}

export async function leaveForGood(req: Request, res: Response) {
  await removeMembership(req.userId!, roomId(req));
  res.status(204).end();
}

export async function updateMember(req: Request, res: Response) {
  const { id, userId } = member(req);
  const body = parse(abilitiesSchema, req.body, "Invalid abilities");
  await setAbilities(req.userId!, id, userId, body);
  res.status(204).end();
}

export async function kick(req: Request, res: Response) {
  const { id, userId } = member(req);
  await kickMember(req.userId!, id, userId);
  res.status(204).end();
}

export async function getQueue(req: Request, res: Response) {
  res.json({ tracks: await listQueue(req.userId!, roomId(req)) });
}

export async function addTracks(req: Request, res: Response) {
  const body = parse(addTracksSchema, req.body, "Send songs or a playlist");
  res.status(201).json(await addToQueue(req.userId!, roomId(req), body));
}

export async function reorder(req: Request, res: Response) {
  const { tracks } = parse(reorderSchema, req.body, "Invalid order");
  await reorderQueue(req.userId!, roomId(req), tracks);
  res.status(204).end();
}

export async function removeTrack(req: Request, res: Response) {
  const ref = parse(trackRefSchema, req.params, "Invalid song");
  await removeFromQueue(req.userId!, roomId(req), ref);
  res.status(204).end();
}
