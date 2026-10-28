import { emitToLive } from "../../socket";
import type { PlaybackCommand } from "../../validators/room";
import { trackKey } from "../music";
import { adjacentTrack, queuedTrack } from "../room_queue_service";
import { expireSkipRequests } from "./chat";
import { can, getLive } from "./store";
import { LiveError, type LiveRoom, type PlaybackState } from "./types";

const TRACK_COOLDOWN_MS = 3000;
const CONTROL_COOLDOWN_MS = 1000;
const RESTART_AFTER_SEC = 3;

type Patch = Partial<Pick<PlaybackState, "track" | "isPlaying" | "position">>;

export const emptyPlayback = (): PlaybackState => ({
  track: null,
  isPlaying: false,
  position: 0,
  at: Date.now(),
  version: 0,
  lockedUntil: 0,
});

export const positionNow = (p: PlaybackState) =>
  p.isPlaying ? p.position + (Date.now() - p.at) / 1000 : p.position;

function apply(room: LiveRoom, patch: Patch, cooldownMs: number) {
  const now = Date.now();
  const trackChanged = patch.track !== undefined && patch.track !== room.playback.track;
  room.playback = {
    ...room.playback,
    ...patch,
    at: now,
    version: room.playback.version + 1,
    lockedUntil: now + cooldownMs,
  };

  if (trackChanged) expireSkipRequests(room);
  scheduleAdvance(room);
  emitToLive(room.id, "room:playback", room.playback);
}

function scheduleAdvance(room: LiveRoom) {
  clearTimeout(room.advanceTimer);
  const p = room.playback;
  if (!p.isPlaying || !p.track || p.track.durationSec <= 0) return;

  const ms = (p.track.durationSec - positionNow(p)) * 1000;
  room.advanceTimer = setTimeout(() => {
    autoAdvance(room).catch((e) => console.error("[room] auto advance failed", e));
  }, Math.max(ms, 0) + 300);
}

const stillCurrent = (room: LiveRoom, version: number) =>
  getLive(room.id) === room && room.playback.version === version;

async function autoAdvance(room: LiveRoom) {
  const { version, track } = room.playback;
  const next = await adjacentTrack(room.id, track, 1);
  if (!stillCurrent(room, version)) return;
  apply(room, next ? { track: next, isPlaying: true, position: 0 } : { isPlaying: false, position: 0 }, 0);
}

export function stopPlayback(room: LiveRoom) {
  clearTimeout(room.advanceTimer);
}

// Re-checked after every await, so two people acting at once can't both win.
function check(room: LiveRoom, version: number) {
  if (getLive(room.id) !== room) throw new LiveError(409, "This room is no longer live");
  if (version !== room.playback.version) {
    throw new LiveError(409, "Someone just changed the song", "STALE");
  }
  const wait = room.playback.lockedUntil - Date.now();
  if (wait > 0) throw new LiveError(429, "Please wait a moment", "COOLDOWN", wait);
}

export async function runCommand(room: LiveRoom, userId: string, cmd: PlaybackCommand) {
  if (!can(room, userId, "canControl")) {
    throw new LiveError(403, "You don't have permission to control playback");
  }
  const current = room.playback.track;
  if (cmd.action === "track" && current && trackKey(current) === trackKey(cmd.track)) return;

  check(room, cmd.version);
  const p = room.playback;

  switch (cmd.action) {
    case "play": {
      if (p.track) {
        if (!p.isPlaying) apply(room, { isPlaying: true, position: positionNow(p) }, CONTROL_COOLDOWN_MS);
        return;
      }
      const first = await adjacentTrack(room.id, null, 1);
      check(room, cmd.version);
      if (!first) throw new LiveError(409, "Add a song to the queue first");
      return apply(room, { track: first, isPlaying: true, position: 0 }, TRACK_COOLDOWN_MS);
    }

    case "pause":
      if (p.isPlaying) apply(room, { isPlaying: false, position: positionNow(p) }, CONTROL_COOLDOWN_MS);
      return;

    case "seek": {
      if (!p.track) throw new LiveError(409, "Nothing is playing");
      const max = p.track.durationSec > 0 ? p.track.durationSec - 1 : cmd.position;
      return apply(room, { position: Math.min(cmd.position, Math.max(max, 0)) }, CONTROL_COOLDOWN_MS);
    }

    case "prev": {
      if (!p.track) throw new LiveError(409, "Nothing is playing");
      if (positionNow(p) > RESTART_AFTER_SEC) return apply(room, { position: 0 }, CONTROL_COOLDOWN_MS);
      const prev = await adjacentTrack(room.id, p.track, -1);
      check(room, cmd.version);
      return apply(room, prev ? { track: prev, isPlaying: true, position: 0 } : { position: 0 }, TRACK_COOLDOWN_MS);
    }

    case "next": {
      const next = await adjacentTrack(room.id, p.track, 1);
      check(room, cmd.version);
      if (!next) throw new LiveError(409, "This is the last song in the queue");
      return apply(room, { track: next, isPlaying: true, position: 0 }, TRACK_COOLDOWN_MS);
    }

    case "track": {
      const track = await queuedTrack(room.id, cmd.track);
      check(room, cmd.version);
      if (!track) throw new LiveError(404, "This song is not in the queue");
      return apply(room, { track, isPlaying: true, position: 0 }, TRACK_COOLDOWN_MS);
    }
  }
}

// Approved skip request: move on like "next", or stop if it was the last song.
export async function skipTrack(room: LiveRoom) {
  const { version, track } = room.playback;
  const next = await adjacentTrack(room.id, track, 1);
  if (!stillCurrent(room, version)) throw new LiveError(409, "The song already changed");
  apply(room, next ? { track: next, isPlaying: true, position: 0 } : { isPlaying: false, position: 0 }, TRACK_COOLDOWN_MS);
}
