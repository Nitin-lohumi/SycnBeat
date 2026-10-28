import { socket, type ClientToServerEvents } from "../realtime/socket";
import type { AckResult, PlaybackState } from "./types";

type Failure = Extract<AckResult, { ok: false }>;

export class RoomActionError extends Error {
  code?: Failure["code"];
  retryIn?: number;

  constructor(message: string, code?: Failure["code"], retryIn?: number) {
    super(message);
    this.code = code;
    this.retryIn = retryIn;
  }
}

type AckEvent = Exclude<keyof ClientToServerEvents, "time:ping" | "room:typing" | "room:reaction" | "dm:typing">;

// Emits with an ack and turns `{ ok: false }` or a timeout into a thrown error.
export async function emitRoom<T = Record<string, unknown>>(
  event: AckEvent,
  data: Parameters<ClientToServerEvents[AckEvent]>[0] = {},
): Promise<T> {
  let res: AckResult;
  try {
    // The union of events confuses socket.io's typings, the payload is still typed above.
    res = await (socket.timeout(8000) as unknown as {
      emitWithAck: (e: string, d: unknown) => Promise<AckResult>;
    }).emitWithAck(event, data);
  } catch {
    throw new RoomActionError("Connection problem, please try again");
  }
  if (!res.ok) {
    const { error, code, retryIn } = res as Failure;
    throw new RoomActionError(error, code, retryIn);
  }
  return res as T;
}

let offset = 0; // server clock minus local clock, in ms

export const serverNow = () => Date.now() + offset;

// A few pings; the one with the shortest round trip gives the best estimate.
export async function syncClock(samples = 4) {
  let best = Infinity;
  for (let i = 0; i < samples; i++) {
    const t0 = Date.now();
    try {
      const server = await socket.timeout(3000).emitWithAck("time:ping");
      const t1 = Date.now();
      if (t1 - t0 < best) {
        best = t1 - t0;
        offset = server + (t1 - t0) / 2 - t1;
      }
    } catch {
      /* try the next sample */
    }
  }
}

export function expectedPosition(p: PlaybackState) {
  const pos = p.isPlaying ? p.position + (serverNow() - p.at) / 1000 : p.position;
  return p.track?.durationSec ? Math.min(pos, p.track.durationSec) : pos;
}
