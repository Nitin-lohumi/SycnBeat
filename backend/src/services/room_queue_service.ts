import { prisma } from "../config/prisma";
import { emitToLive } from "../socket";
import { AppError } from "../utils/AppError";
import { getLive } from "./live/store";
import { trackKey, type TrackRef } from "./music";
import { resolveTracks, trackSelect } from "./track_service";
import { publicUserSelect } from "./user_service";

const queueChanged = (roomId: string) => emitToLive(roomId, "room:queue:changed");

async function membershipOf(me: string, roomId: string) {
  const member = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId: me } },
    select: { canQueue: true, room: { select: { ownerId: true } } },
  });
  if (!member) throw new AppError(404, "Room not found");
  return member;
}

async function assertCanQueue(me: string, roomId: string) {
  const member = await membershipOf(me, roomId);
  const isAdmin = member.room.ownerId === me || getLive(roomId)?.tempAdminId === me;
  if (!isAdmin && !member.canQueue) {
    throw new AppError(403, "You don't have permission to change the queue");
  }
}

async function queueTracks(roomId: string) {
  const rows = await prisma.roomTrack.findMany({
    where: { roomId },
    orderBy: { position: "asc" },
    select: { track: { select: trackSelect } },
  });
  return rows.map((r) => r.track);
}

export async function listQueue(me: string, roomId: string) {
  await membershipOf(me, roomId);
  const rows = await prisma.roomTrack.findMany({
    where: { roomId },
    orderBy: { position: "asc" },
    select: {
      addedAt: true,
      addedBy: { select: publicUserSelect },
      track: { select: trackSelect },
    },
  });
  return rows.map(({ track, ...rest }) => ({ ...track, ...rest }));
}

// Neighbour of `current` in the queue; when current was removed, start from the top.
export async function adjacentTrack(roomId: string, current: TrackRef | null, dir: 1 | -1) {
  const tracks = await queueTracks(roomId);
  if (!current) return dir === 1 ? (tracks[0] ?? null) : null;
  const i = tracks.findIndex((t) => trackKey(t) === trackKey(current));
  if (i === -1) return tracks[0] ?? null;
  return tracks[i + dir] ?? null;
}

export async function queuedTrack(roomId: string, ref: TrackRef) {
  const row = await prisma.roomTrack.findFirst({
    where: { roomId, track: { source: ref.source, sourceId: ref.sourceId } },
    select: { track: { select: trackSelect } },
  });
  return row?.track ?? null;
}

export async function appendTracks(roomId: string, refs: TrackRef[], addedById: string) {
  const resolved = await resolveTracks(refs);

  const count = await prisma.$transaction(async (tx) => {
    const last = await tx.roomTrack.findFirst({
      where: { roomId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    const start = (last?.position ?? -1) + 1;
    const { count } = await tx.roomTrack.createMany({
      data: resolved.refs.map((r, i) => ({
        roomId,
        trackId: resolved.ids.get(trackKey(r))!,
        addedById,
        position: start + i,
      })),
      skipDuplicates: true,
    });
    return count;
  });

  if (count === 0) {
    throw new AppError(409, refs.length === 1 ? "Already in the queue" : "All these songs are already in the queue");
  }
  queueChanged(roomId);
  return count;
}

type AddInput = { tracks: TrackRef[] } | { playlistId: string };

export async function addToQueue(me: string, roomId: string, input: AddInput) {
  await assertCanQueue(me, roomId);

  let refs: TrackRef[];
  if ("tracks" in input) {
    refs = input.tracks;
  } else {
    const playlist = await prisma.playlist.findFirst({
      where: { id: input.playlistId, ownerId: me },
      select: { tracks: { orderBy: { position: "asc" }, select: { track: { select: { source: true, sourceId: true } } } } },
    });
    if (!playlist) throw new AppError(404, "Playlist not found");
    refs = playlist.tracks.map((t) => t.track);
    if (refs.length === 0) throw new AppError(400, "This playlist has no songs");
  }

  return { added: await appendTracks(roomId, refs, me) };
}

export async function removeFromQueue(me: string, roomId: string, ref: TrackRef) {
  await assertCanQueue(me, roomId);
  const { count } = await prisma.roomTrack.deleteMany({
    where: { roomId, track: { source: ref.source, sourceId: ref.sourceId } },
  });
  if (count === 0) throw new AppError(404, "Song is not in the queue");
  queueChanged(roomId);
}

// Songs not mentioned in `refs` keep their old order after the given ones.
export async function reorderQueue(me: string, roomId: string, refs: TrackRef[]) {
  await assertCanQueue(me, roomId);
  const rows = await prisma.roomTrack.findMany({
    where: { roomId },
    orderBy: { position: "asc" },
    select: { id: true, track: { select: { source: true, sourceId: true } } },
  });

  const byKey = new Map(rows.map((r) => [trackKey(r.track), r.id]));
  const seen = new Set(refs.map((r) => byKey.get(trackKey(r))).filter((id): id is string => !!id));
  const ids = [...seen, ...rows.map((r) => r.id).filter((id) => !seen.has(id))];

  await prisma.$transaction(
    ids.map((id, position) => prisma.roomTrack.update({ where: { id }, data: { position } })),
  );
  queueChanged(roomId);
}
