import type { Request, Response } from "express";
import { likeTrack, listLikedKeys, listLikedTracks, unlikeTrack } from "../services/like_service";
import { parse } from "../utils/validate";
import { trackRefSchema } from "../validators/music";

export async function getLiked(req: Request, res: Response) {
  res.json({ tracks: await listLikedTracks(req.userId!) });
}

export async function getLikedKeys(req: Request, res: Response) {
  res.json({ keys: await listLikedKeys(req.userId!) });
}

export async function like(req: Request, res: Response) {
  const ref = parse(trackRefSchema, req.params, "Invalid song");
  await likeTrack(req.userId!, ref);
  res.status(204).end();
}

export async function unlike(req: Request, res: Response) {
  const ref = parse(trackRefSchema, req.params, "Invalid song");
  await unlikeTrack(req.userId!, ref);
  res.status(204).end();
}
