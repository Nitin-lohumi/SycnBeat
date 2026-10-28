import { prisma } from "../config/prisma";
import type { TrackSource } from "../generated/prisma/client";
import { AppError } from "../utils/AppError";
import { getProvider, trackKey, type TrackRef } from "./music";

export const trackSelect = {
  source: true,
  sourceId: true,
  title: true,
  artist: true,
  durationSec: true,
  thumbnailUrl: true,
  audioUrl: true,
} as const;

function dedupe(refs: TrackRef[]) {
  return [...new Map(refs.map((r) => [trackKey(r), r])).values()];
}

async function findTrackIds(refs: TrackRef[]) {
  if (refs.length === 0) return new Map<string, string>();
  const rows = await prisma.track.findMany({
    where: { OR: refs.map(({ source, sourceId }) => ({ source, sourceId })) },
    select: { id: true, source: true, sourceId: true },
  });
  return new Map(rows.map((r) => [trackKey(r), r.id]));
}

// Track data always comes from the provider, never from the client, so audioUrl can't be spoofed.
export async function resolveTracks(input: TrackRef[]) {
  const refs = dedupe(input);
  const ids = await findTrackIds(refs);
  const missing = refs.filter((r) => !ids.has(trackKey(r)));
  if (missing.length === 0) return { refs, ids };

  const bySource = new Map<TrackSource, string[]>();
  for (const r of missing) bySource.set(r.source, [...(bySource.get(r.source) ?? []), r.sourceId]);

  for (const [source, sourceIds] of bySource) {
    const tracks = await getProvider(source).getTracks(sourceIds);
    await prisma.track.createMany({ data: tracks, skipDuplicates: true });
  }

  for (const [key, id] of await findTrackIds(missing)) ids.set(key, id);
  if (ids.size < refs.length) throw new AppError(404, "Some songs are no longer available");
  return { refs, ids };
}

export async function resolveTrack(ref: TrackRef) {
  const { ids } = await resolveTracks([ref]);
  return ids.get(trackKey(ref))!;
}

export async function resolveTrackDTO(ref: TrackRef) {
  const id = await resolveTrack(ref);
  return prisma.track.findUniqueOrThrow({ where: { id }, select: trackSelect });
}
