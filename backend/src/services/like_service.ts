import { prisma } from "../config/prisma";
import { trackKey, type TrackRef } from "./music";
import { libraryChanged } from "./playlist_service";
import { resolveTrack, trackSelect } from "./track_service";

export async function listLikedTracks(me: string) {
  const rows = await prisma.likedTrack.findMany({
    where: { userId: me },
    orderBy: { likedAt: "desc" },
    select: { likedAt: true, track: { select: trackSelect } },
  });
  return rows.map(({ track, likedAt }) => ({ ...track, addedAt: likedAt }));
}

// "JAMENDO:123"-style keys so the client can show a filled heart anywhere.
export async function listLikedKeys(me: string) {
  const rows = await prisma.likedTrack.findMany({
    where: { userId: me },
    select: { track: { select: { source: true, sourceId: true } } },
  });
  return rows.map((r) => trackKey(r.track));
}

export async function likeTrack(me: string, ref: TrackRef) {
  const trackId = await resolveTrack(ref);
  await prisma.likedTrack.upsert({
    where: { userId_trackId: { userId: me, trackId } },
    create: { userId: me, trackId },
    update: {},
  });
  libraryChanged(me);
}

export async function unlikeTrack(me: string, ref: TrackRef) {
  await prisma.likedTrack.deleteMany({
    where: { userId: me, track: { source: ref.source, sourceId: ref.sourceId } },
  });
  libraryChanged(me);
}
