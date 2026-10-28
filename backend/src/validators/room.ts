import { z } from "zod";
import { trackRefSchema } from "./music";

const name = z.string().trim().min(1, "Name is required").max(60);
const description = z.string().trim().max(300).nullish();
const id = z.string().min(1);

export const createRoomSchema = z.object({ name, description });

export const updateRoomSchema = z
  .object({ name: name.optional(), description })
  .refine((v) => v.name !== undefined || v.description !== undefined, "Nothing to update");

export const roomIdSchema = z.object({ id });
export const memberParamSchema = z.object({ id, userId: id });
export const inviteSchema = z.object({ userIds: z.array(id).min(1).max(50) });

export const abilitiesSchema = z
  .object({ canQueue: z.boolean().optional(), canControl: z.boolean().optional() })
  .refine((v) => v.canQueue !== undefined || v.canControl !== undefined, "Nothing to update");

export const addTracksSchema = z.union([
  z.object({ tracks: z.array(trackRefSchema).min(1).max(200) }),
  z.object({ playlistId: id }),
]);

export const reorderSchema = z.object({ tracks: z.array(trackRefSchema).max(500) });

// Socket payloads
const version = z.number().int().min(0);

export const joinSchema = z.object({ roomId: id });

export const playbackSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("play"), version }),
  z.object({ action: z.literal("pause"), version }),
  z.object({ action: z.literal("next"), version }),
  z.object({ action: z.literal("prev"), version }),
  z.object({ action: z.literal("seek"), version, position: z.number().min(0) }),
  z.object({ action: z.literal("track"), version, track: trackRefSchema }),
]);

export const chatSchema = z.object({ text: z.string().trim().min(1).max(500) });
export const typingSchema = z.object({ isTyping: z.boolean() });

export const REACTIONS = ["🔥", "❤️", "😂", "👏", "🎉", "😮"] as const;
export const reactionSchema = z.object({ emoji: z.enum(REACTIONS) });

export const requestSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("song"), track: trackRefSchema }),
  z.object({ type: z.literal("ability"), ability: z.enum(["canQueue", "canControl"]) }),
  z.object({ type: z.literal("skip") }),
]);

export const resolveRequestSchema = z.object({ id, approve: z.boolean() });

export type PlaybackCommand = z.infer<typeof playbackSchema>;
export type RoomRequestInput = z.infer<typeof requestSchema>;
