import { z } from "zod";
import { TrackSource } from "../generated/prisma/client";

export const trackRefSchema = z.object({
  source: z.enum(TrackSource),
  sourceId: z.string().trim().min(1).max(64),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().max(80).default(""),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).max(2000).default(0),
});

const name = z.string().trim().min(1, "Name is required").max(60);
const description = z.string().trim().max(300).nullish();
const tracks = z.array(trackRefSchema).max(500);

export const createPlaylistSchema = z.object({ name, description, tracks: tracks.optional() });

export const updatePlaylistSchema = z
  .object({ name: name.optional(), description, tracks: tracks.optional() })
  .refine((v) => Object.values(v).some((x) => x !== undefined), "Nothing to update");

export const idParamSchema = z.object({ id: z.string().min(1) });
