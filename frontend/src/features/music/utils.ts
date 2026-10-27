import type { Track, TrackRef } from "./types";

export const trackKey = (t: TrackRef) => `${t.source}:${t.sourceId}`;

export const toRef = ({ source, sourceId }: TrackRef): TrackRef => ({ source, sourceId });

// Backend redirects to a provider file that is known to work.
export const streamUrl = (t: TrackRef) =>
  `${import.meta.env.VITE_API_URL}/api/music/stream/${t.source}/${encodeURIComponent(t.sourceId)}`;

export function formatDuration(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

export function totalDuration(tracks: Track[]) {
  const min = Math.round(tracks.reduce((sum, t) => sum + t.durationSec, 0) / 60);
  return min >= 60 ? `${Math.floor(min / 60)} hr ${min % 60} min` : `${min} min`;
}

export const songCount = (n: number) => `${n} ${n === 1 ? "song" : "songs"}`;

export function uniqueTracks(tracks: Track[]) {
  const seen = new Set<string>();
  return tracks.filter((t) => {
    const key = trackKey(t);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
