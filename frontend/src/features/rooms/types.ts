import type { PublicUser } from "../../types/user";
import type { Track } from "../music/types";

export type Ability = "canQueue" | "canControl";

export interface RoomCard {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  ownerId: string;
  updatedAt: string;
  owner: PublicUser;
  memberCount: number;
  isLive: boolean;
  listenerCount: number;
  listeners: PublicUser[];
  nowPlaying: { title: string; artist: string | null; thumbnailUrl: string | null } | null;
}

export interface RoomsList {
  owned: RoomCard[];
  joined: RoomCard[];
  currentRoomId: string | null;
}

export interface RoomMember {
  canQueue: boolean;
  canControl: boolean;
  joinedAt: string;
  user: PublicUser;
}

export interface RoomDetail {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  ownerId: string;
  createdAt: string;
  owner: PublicUser;
  members: RoomMember[];
  isLive: boolean;
}

export interface QueueTrack extends Track {
  addedAt: string;
  addedBy: PublicUser | null;
}

export interface InvitableFriend {
  user: PublicUser;
  status: "MEMBER" | "INVITED" | "NONE";
}

export interface PlaybackState {
  track: Track | null;
  isPlaying: boolean;
  position: number;
  at: number;
  version: number;
  lockedUntil: number;
}

export interface Listener {
  user: PublicUser;
  joinedAt: number;
  online: boolean;
  canQueue: boolean;
  canControl: boolean;
}

export interface PresenceState {
  adminId: string | null;
  tempAdminId: string | null;
  listeners: Listener[];
}

export type RoomRequest =
  | { type: "song"; track: Track }
  | { type: "ability"; ability: Ability }
  | { type: "skip"; track: Track };

export type SystemEvent = "joined" | "left" | "removed" | "admin" | "back";

export type ChatMessage =
  | { id: string; kind: "text"; user: PublicUser; text: string; at: number }
  | { id: string; kind: "system"; text: string; at: number; event?: SystemEvent; userId?: string }
  | {
      id: string;
      kind: "request";
      user: PublicUser;
      request: RoomRequest;
      status: "pending" | "approved" | "declined" | "expired";
      at: number;
    };

export type RequestMessage = Extract<ChatMessage, { kind: "request" }>;

export interface RoomInfo {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
}

export interface RoomSnapshot {
  room: RoomInfo;
  presence: PresenceState;
  playback: PlaybackState;
  chat: ChatMessage[];
  serverNow: number;
}

export type LeaveReason = "left" | "disconnected" | "kicked" | "removed" | "ended";

export type AckResult =
  | ({ ok: true } & Record<string, unknown>)
  | { ok: false; error: string; code?: "STALE" | "COOLDOWN"; retryIn?: number };

export type PlaybackAction =
  | { action: "play" | "pause" | "next" | "prev" }
  | { action: "seek"; position: number }
  | { action: "track"; track: { source: Track["source"]; sourceId: string } };

export const REACTIONS = ["🔥", "❤️", "😂", "👏", "🎉", "😮"] as const;
