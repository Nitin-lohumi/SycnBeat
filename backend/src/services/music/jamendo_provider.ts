import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import { TtlCache } from "../../utils/ttlCache";
import type { MusicProvider, TrackDTO } from "./types";

const BASE_URL = "https://api.jamendo.com/v3.0";

interface JamendoTrack {
  id: string;
  name: string;
  duration: number;
  artist_name?: string;
  album_image?: string;
  image?: string;
  audio?: string;
}

interface JamendoResponse {
  headers: { status: string; code: number; error_message?: string; warnings?: string; results_count?: number };
  results: JamendoTrack[];
}

async function request(path: string, params: Record<string, string>) {
  const url = new URL(BASE_URL + path);
  url.search = new URLSearchParams({
    client_id: env.JAMENDO_CLIENT_ID,
    format: "json",
    audioformat: "mp32",
    imagesize: "300",
    ...params,
  }).toString();

  let body: JamendoResponse;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    body = (await res.json()) as JamendoResponse;
  } catch (e) {
    console.error("Jamendo request failed:", e);
    throw new AppError(502, "Music service is unavailable, try again");
  }

  if (body.headers.status !== "success") {
    console.error("Jamendo error:", body.headers);
    throw new AppError(502, "Music service is unavailable, try again");
  }
  return body.results ?? [];
}

function toDTO(t: JamendoTrack): TrackDTO {
  return {
    source: "JAMENDO",
    sourceId: String(t.id),
    title: t.name,
    artist: t.artist_name || null,
    durationSec: Math.round(Number(t.duration) || 0),
    thumbnailUrl: t.album_image || t.image || null,
    audioUrl: t.audio || null,
  };
}

// Requests only the first byte, just to see if the file exists.
async function probe(url: string) {
  try {
    const res = await fetch(url, { headers: { Range: "bytes=0-0" }, signal: AbortSignal.timeout(5000) });
    await res.body?.cancel();
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

// false = confirmed missing on Jamendo's storage.
const fileCache = new TtlCache<string | false>(12 * 60 * 60_000, 5000);

// Some tracks only have mp31, and some have no file at all (404 on both).
async function resolveFile(id: string, audio: string | null) {
  const cached = fileCache.get(id);
  if (cached !== undefined) return cached || null;
  if (!audio) return null;

  const candidates = [...new Set([audio, audio.replace("format=mp32", "format=mp31")])];
  let unsure: string | null = null;

  for (const url of candidates) {
    const { ok, status } = await probe(url);
    if (ok) {
      fileCache.set(id, url);
      return url;
    }
    if (status !== 404 && status !== 410) unsure ??= url;
  }

  // Couldn't confirm either way (timeout etc.): let the browser try instead of hiding the song.
  if (unsure) return unsure;
  fileCache.set(id, false);
  return null;
}

async function onlyPlayable(tracks: TrackDTO[]) {
  const checked = await Promise.all(
    tracks.map(async (t) => ((await resolveFile(t.sourceId, t.audioUrl)) ? t : null)),
  );
  const playable = checked.filter((t): t is TrackDTO => !!t);
  if (playable.length < tracks.length) console.info(`Jamendo: hid ${tracks.length - playable.length} songs with no audio file`);
  return playable;
}

export const jamendoProvider: MusicProvider = {
  source: "JAMENDO",

  async search({ q, limit, offset }) {
    const results = await request("/tracks/", {
      limit: String(limit),
      offset: String(offset),
      order: q ? "relevance" : "popularity_week",
      ...(q && { search: q }),
    });
    return {
      tracks: await onlyPlayable(results.map(toDTO)),
      nextOffset: results.length === limit ? offset + limit : null,
    };
  },

  async getTracks(ids) {
    const tracks: TrackDTO[] = [];
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100);
      const results = await request("/tracks/", { id: chunk.join(" "), limit: String(chunk.length) });
      tracks.push(...(await onlyPlayable(results.map(toDTO))));
    }
    return tracks;
  },

  async resolveStream(sourceId) {
    const cached = fileCache.get(sourceId);
    if (cached !== undefined) return cached || null;

    const [track] = await request("/tracks/", { id: sourceId, limit: "1" });
    return track ? resolveFile(sourceId, track.audio || null) : null;
  },
};
