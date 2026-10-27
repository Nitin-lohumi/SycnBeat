import { prisma } from "../config/prisma";
import { emitToUsers } from "../socket";
import { AppError } from "../utils/AppError";
import { isUniqueViolation } from "../utils/prismaErrors";
import { trackKey, type TrackRef } from "./music";
import { resolveTrack, resolveTracks, trackSelect } from "./track_service";

const COVER_COUNT = 4;

const coverTracks = {
  orderBy: { position: "asc" },
  take: COVER_COUNT,
  select: { track: { select: { thumbnailUrl: true } } },
} as const;

const covers = (rows: { track: { thumbnailUrl: string | null } }[]) =>
  rows.map((r) => r.track.thumbnailUrl).filter((url): url is string => !!url);

export const libraryChanged = (me: string) => emitToUsers(me, "library:changed");

async function assertOwner(me: string, id: string) {
  const playlist = await prisma.playlist.findFirst({ where: { id, ownerId: me }, select: { id: true } });
  if (!playlist) throw new AppError(404, "Playlist not found");
}

export async function listPlaylists(me: string) {
  const [playlists, likedCount, likedCovers] = await Promise.all([
    prisma.playlist.findMany({
      where: { ownerId: me },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        coverUrl: true,
        updatedAt: true,
        _count: { select: { tracks: true } },
        tracks: coverTracks,
      },
    }),
    prisma.likedTrack.count({ where: { userId: me } }),
    prisma.likedTrack.findMany({
      where: { userId: me },
      orderBy: { likedAt: "desc" },
      take: COVER_COUNT,
      select: { track: { select: { thumbnailUrl: true } } },
    }),
  ]);

  return {
    liked: { trackCount: likedCount, covers: covers(likedCovers) },
    playlists: playlists.map(({ _count, tracks, ...p }) => ({
      ...p,
      trackCount: _count.tracks,
      covers: covers(tracks),
    })),
  };
}

export async function getPlaylist(me: string, id: string) {
  const playlist = await prisma.playlist.findFirst({
    where: { id, ownerId: me },
    select: {
      id: true,
      name: true,
      description: true,
      coverUrl: true,
      createdAt: true,
      updatedAt: true,
      tracks: {
        orderBy: { position: "asc" },
        select: { addedAt: true, track: { select: trackSelect } },
      },
    },
  });
  if (!playlist) throw new AppError(404, "Playlist not found");

  return {
    ...playlist,
    tracks: playlist.tracks.map(({ track, addedAt }) => ({ ...track, addedAt })),
  };
}

// Playlist ids (of mine) that already contain this track, for the "Add to playlist" picker.
export async function playlistsContaining(me: string, ref: TrackRef) {
  const rows = await prisma.playlist.findMany({
    where: { ownerId: me, tracks: { some: { track: { source: ref.source, sourceId: ref.sourceId } } } },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

type PlaylistInput = { name: string; description?: string | null; tracks?: TrackRef[] };

export async function createPlaylist(me: string, input: PlaylistInput) {
  const resolved = input.tracks?.length ? await resolveTracks(input.tracks) : null;

  const playlist = await prisma.playlist.create({
    data: {
      ownerId: me,
      name: input.name,
      description: input.description ?? null,
      tracks: resolved
        ? { create: resolved.refs.map((r, position) => ({ trackId: resolved.ids.get(trackKey(r))!, position })) }
        : undefined,
    },
    select: { id: true },
  });

  libraryChanged(me);
  return getPlaylist(me, playlist.id);
}

// When `tracks` is sent, it replaces the whole list in that order (builder "Save").
export async function updatePlaylist(me: string, id: string, input: Partial<PlaylistInput>) {
  await assertOwner(me, id);
  const resolved = input.tracks ? await resolveTracks(input.tracks) : null;

  await prisma.$transaction(async (tx) => {
    await tx.playlist.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        updatedAt: new Date(),
      },
    });
    if (!resolved) return;

    await tx.playlistTrack.deleteMany({ where: { playlistId: id } });
    await tx.playlistTrack.createMany({
      data: resolved.refs.map((r, position) => ({
        playlistId: id,
        trackId: resolved.ids.get(trackKey(r))!,
        position,
      })),
    });
  });

  libraryChanged(me);
  return getPlaylist(me, id);
}

export async function deletePlaylist(me: string, id: string) {
  const { count } = await prisma.playlist.deleteMany({ where: { id, ownerId: me } });
  if (count === 0) throw new AppError(404, "Playlist not found");
  libraryChanged(me);
}

export async function addTrackToPlaylist(me: string, id: string, ref: TrackRef) {
  await assertOwner(me, id);
  const trackId = await resolveTrack(ref);

  try {
    await prisma.$transaction(async (tx) => {
      const last = await tx.playlistTrack.findFirst({
        where: { playlistId: id },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      await tx.playlistTrack.create({
        data: { playlistId: id, trackId, position: (last?.position ?? -1) + 1 },
      });
      await tx.playlist.update({ where: { id }, data: { updatedAt: new Date() } });
    });
  } catch (e) {
    if (isUniqueViolation(e)) throw new AppError(409, "Already in this playlist");
    throw e;
  }

  libraryChanged(me);
}

export async function removeTrackFromPlaylist(me: string, id: string, ref: TrackRef) {
  await assertOwner(me, id);

  const { count } = await prisma.playlistTrack.deleteMany({
    where: { playlistId: id, track: { source: ref.source, sourceId: ref.sourceId } },
  });
  if (count === 0) throw new AppError(404, "Song is not in this playlist");

  await prisma.playlist.update({ where: { id }, data: { updatedAt: new Date() } });
  libraryChanged(me);
}
