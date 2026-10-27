import type { Request, Response } from "express";
import {
  addTrackToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylist,
  listPlaylists,
  playlistsContaining,
  removeTrackFromPlaylist,
  updatePlaylist,
} from "../services/playlist_service";
import { parse } from "../utils/validate";
import {
  createPlaylistSchema,
  idParamSchema,
  trackRefSchema,
  updatePlaylistSchema,
} from "../validators/music";

const playlistId = (req: Request) => parse(idParamSchema, req.params, "Invalid playlist id").id;

export async function getAll(req: Request, res: Response) {
  res.json(await listPlaylists(req.userId!));
}

export async function getOne(req: Request, res: Response) {
  res.json({ playlist: await getPlaylist(req.userId!, playlistId(req)) });
}

export async function membership(req: Request, res: Response) {
  const ref = parse(trackRefSchema, req.query, "source and sourceId are required");
  res.json({ playlistIds: await playlistsContaining(req.userId!, ref) });
}

export async function create(req: Request, res: Response) {
  const body = parse(createPlaylistSchema, req.body, "Invalid playlist data");
  res.status(201).json({ playlist: await createPlaylist(req.userId!, body) });
}

export async function update(req: Request, res: Response) {
  const body = parse(updatePlaylistSchema, req.body, "Invalid playlist data");
  res.json({ playlist: await updatePlaylist(req.userId!, playlistId(req), body) });
}

export async function remove(req: Request, res: Response) {
  await deletePlaylist(req.userId!, playlistId(req));
  res.status(204).end();
}

export async function addTrack(req: Request, res: Response) {
  const ref = parse(trackRefSchema, req.body, "Invalid song");
  await addTrackToPlaylist(req.userId!, playlistId(req), ref);
  res.status(204).end();
}

export async function removeTrack(req: Request, res: Response) {
  const ref = parse(trackRefSchema, req.params, "Invalid song");
  await removeTrackFromPlaylist(req.userId!, playlistId(req), ref);
  res.status(204).end();
}
