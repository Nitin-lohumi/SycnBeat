export type TrackSource = "JAMENDO" | "YOUTUBE" | "UPLOAD";

export interface TrackRef {
  source: TrackSource;
  sourceId: string;
}

export interface Track extends TrackRef {
  title: string;
  artist: string | null;
  durationSec: number;
  thumbnailUrl: string | null;
  audioUrl: string | null;
  addedAt?: string;
}

export interface TrackPage {
  tracks: Track[];
  nextOffset: number | null;
}

export interface PlaylistSummary {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  updatedAt: string;
  trackCount: number;
  covers: string[];
}

export interface Library {
  liked: { trackCount: number; covers: string[] };
  playlists: PlaylistSummary[];
}

export interface PlaylistDetail {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  createdAt: string;
  updatedAt: string;
  tracks: Track[];
}

export interface PlaylistInput {
  name?: string;
  description?: string | null;
  tracks?: TrackRef[];
}
