import type { Request, Response } from "express";
import { resolveStreamUrl, searchTracks } from "../services/music";
import { AppError } from "../utils/AppError";
import { parse } from "../utils/validate";
import { searchQuerySchema, trackRefSchema } from "../validators/music";

// Empty q returns trending tracks.
export async function search(req: Request, res: Response) {
  const { q, limit, offset } = parse(searchQuerySchema, req.query, "Invalid search query");
  res.json(await searchTracks(q, limit, offset));
}

// The player always asks us; we redirect to a provider URL that actually works.
export async function stream(req: Request, res: Response) {
  const { source, sourceId } = parse(trackRefSchema, req.params, "Invalid song");
  const url = await resolveStreamUrl(source, sourceId);
  if (!url) throw new AppError(404, "This song can't be played right now");
  res.set("Cache-Control", "private, max-age=3600").redirect(302, url);
}
