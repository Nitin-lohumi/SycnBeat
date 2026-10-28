import { randomUUID } from "node:crypto";
import { emitToLive } from "../../socket";
import { AppError } from "../../utils/AppError";
import type { RoomRequestInput } from "../../validators/room";
import { trackKey } from "../music";
import { appendTracks } from "../room_queue_service";
import { applyAbilities } from "../room_service";
import { resolveTrackDTO } from "../track_service";
import { skipTrack } from "./playback";
import { can, isAdmin, throttled } from "./store";
import { LiveError, type ChatMessage, type LiveRoom, type RoomRequest, type SystemEvent } from "./types";

const MAX_MESSAGES = 100;

type RequestMessage = Extract<ChatMessage, { kind: "request" }>;

function push<M extends ChatMessage>(room: LiveRoom, msg: M) {
  room.chat.push(msg);
  if (room.chat.length > MAX_MESSAGES) room.chat.shift();
  emitToLive(room.id, "room:chat", msg);
  return msg;
}

// `about` lets each client reword it for the person it's about ("You're now the admin").
export const systemMessage = (room: LiveRoom, text: string, about?: { event: SystemEvent; userId: string }) =>
  push(room, { id: randomUUID(), kind: "system", text, at: Date.now(), ...about });

function listenerOf(room: LiveRoom, userId: string) {
  const listener = room.listeners.get(userId);
  if (!listener) throw new LiveError(409, "You are not in this room");
  return listener;
}

export function sendChat(room: LiveRoom, userId: string, text: string) {
  const { user } = listenerOf(room, userId);
  if (throttled(`chat:${userId}`, 400)) throw new LiveError(429, "You're sending messages too fast");
  return push(room, { id: randomUUID(), kind: "text", user, text, at: Date.now() });
}

export function react(room: LiveRoom, userId: string, emoji: string) {
  if (!room.listeners.has(userId) || throttled(`react:${userId}`, 250)) return;
  emitToLive(room.id, "room:reaction", { userId, emoji });
}

const pendingOf = (room: LiveRoom, userId: string) =>
  room.chat.filter(
    (m): m is RequestMessage => m.kind === "request" && m.status === "pending" && m.user.id === userId,
  );

export async function createRequest(room: LiveRoom, userId: string, input: RoomRequestInput) {
  const { user } = listenerOf(room, userId);
  const pending = pendingOf(room, userId);
  let request: RoomRequest;

  if (input.type === "song") {
    if (can(room, userId, "canQueue")) throw new LiveError(409, "You can add songs to the queue yourself");
    const key = trackKey(input.track);
    if (pending.some((m) => m.request.type === "song" && trackKey(m.request.track) === key)) {
      throw new LiveError(409, "You already requested this song");
    }
    if (throttled(`request:${userId}`, 2000)) throw new LiveError(429, "Please wait before sending another request");
    request = { type: "song", track: await resolveTrackDTO(input.track) };
  } else if (input.type === "skip") {
    const track = room.playback.track;
    if (!track) throw new LiveError(409, "Nothing is playing");
    if (can(room, userId, "canControl")) throw new LiveError(409, "You can skip the song yourself");
    if (pending.some((m) => m.request.type === "skip" && trackKey(m.request.track) === trackKey(track))) {
      throw new LiveError(409, "You already asked to skip this song");
    }
    request = { type: "skip", track };
  } else {
    if (can(room, userId, input.ability)) throw new LiveError(409, "You already have this ability");
    if (pending.some((m) => m.request.type === "ability" && m.request.ability === input.ability)) {
      throw new LiveError(409, "Request already sent");
    }
    request = { type: "ability", ability: input.ability };
  }

  return push(room, { id: randomUUID(), kind: "request", user, request, status: "pending", at: Date.now() });
}

function setStatus(room: LiveRoom, msg: RequestMessage, status: RequestMessage["status"]) {
  msg.status = status;
  emitToLive(room.id, "room:chat:update", msg);
}

// Skip requests are only about the song that was playing; once it changes they are moot.
export function expireSkipRequests(room: LiveRoom) {
  const current = room.playback.track && trackKey(room.playback.track);
  for (const m of room.chat) {
    if (m.kind === "request" && m.status === "pending" && m.request.type === "skip" && trackKey(m.request.track) !== current) {
      setStatus(room, m, "expired");
    }
  }
}

// Songs: any admin. Skips: anyone with playback control. Abilities: only the owner (saved in the DB).
export async function resolveRequest(room: LiveRoom, userId: string, id: string, approve: boolean) {
  const msg = room.chat.find((m): m is RequestMessage => m.kind === "request" && m.id === id);
  if (!msg || msg.status !== "pending") throw new LiveError(404, "This request was already handled");

  const req = msg.request;
  if (req.type === "song" && !isAdmin(room, userId)) {
    throw new LiveError(403, "Only the admin can approve songs");
  }
  if (req.type === "skip" && !can(room, userId, "canControl")) {
    throw new LiveError(403, "Only people with playback control can skip");
  }
  if (req.type === "ability" && userId !== room.ownerId) {
    throw new LiveError(403, "Only the room owner can give abilities");
  }

  msg.status = approve ? "approved" : "declined";
  try {
    if (approve && req.type === "skip") {
      await skipTrack(room);
      // Others asked to skip the same song: that's done now.
      for (const m of room.chat) {
        if (m !== msg && m.kind === "request" && m.status === "pending" && m.request.type === "skip") setStatus(room, m, "approved");
      }
    }
    if (approve && req.type === "song") {
      await appendTracks(room.id, [req.track], msg.user.id).catch((e) => {
        if (!(e instanceof AppError && e.status === 409)) throw e;
      });
    }
    if (approve && req.type === "ability") {
      await applyAbilities(room.id, msg.user.id, { [req.ability]: true });
    }
  } catch (e) {
    msg.status = "pending";
    throw e;
  }

  if (approve && req.type === "skip") systemMessage(room, `Skipped on ${msg.user.name}'s request`);
  emitToLive(room.id, "room:chat:update", msg);
}
