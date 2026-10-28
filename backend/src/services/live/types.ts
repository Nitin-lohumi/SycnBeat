import type { TrackDTO } from "../music";
import type { PublicUser } from "../user_service";
import { AppError } from "../../utils/AppError";

export type Ability = "canQueue" | "canControl";

export interface PlaybackState {
  track: TrackDTO | null;
  isPlaying: boolean;
  position: number; // seconds, measured at `at`
  at: number; // server time in ms
  version: number;
  lockedUntil: number;
}

export type RoomRequest =
  | { type: "song"; track: TrackDTO }
  | { type: "ability"; ability: Ability }
  | { type: "skip"; track: TrackDTO }; // the song that was playing when they asked

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

export interface Listener {
  user: PublicUser;
  joinedAt: number;
  sockets: Set<string>;
  canQueue: boolean;
  canControl: boolean;
  graceTimer?: NodeJS.Timeout;
}

export interface LiveRoom {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  listeners: Map<string, Listener>;
  tempAdminId: string | null;
  playback: PlaybackState;
  advanceTimer?: NodeJS.Timeout;
  chat: ChatMessage[];
}

export interface PresenceState {
  adminId: string | null;
  tempAdminId: string | null;
  listeners: {
    user: PublicUser;
    joinedAt: number;
    online: boolean;
    canQueue: boolean;
    canControl: boolean;
  }[];
}

export interface RoomSnapshot {
  room: { id: string; name: string; description: string | null; ownerId: string };
  presence: PresenceState;
  playback: PlaybackState;
  chat: ChatMessage[];
  serverNow: number;
}

// Carries a machine-readable code so the client can react (e.g. show a cooldown ring).
export class LiveError extends AppError {
  constructor(status: number, message: string, public code?: "STALE" | "COOLDOWN", public retryIn?: number) {
    super(status, message);
  }
}
