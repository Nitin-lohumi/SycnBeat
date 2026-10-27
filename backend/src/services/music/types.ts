import type { TrackSource } from "../../generated/prisma/client";

// The only track shape the frontend ever sees, whatever the provider.
export interface TrackDTO {
  source: TrackSource;
  sourceId: string;
  title: string;
  artist: string | null;
  durationSec: number;
  thumbnailUrl: string | null;
  audioUrl: string | null;
}

export interface TrackRef {
  source: TrackSource;
  sourceId: string;
}

export interface TrackPage {
  tracks: TrackDTO[];
  nextOffset: number | null;
}

export interface MusicProvider {
  source: TrackSource;
  search(opts: { q: string; limit: number; offset: number }): Promise<TrackPage>;
  getTracks(ids: string[]): Promise<TrackDTO[]>;
  // A direct audio URL that is confirmed to work right now, or null.
  resolveStream(sourceId: string): Promise<string | null>;
}

export const trackKey = (t: TrackRef) => `${t.source}:${t.sourceId}`;
