import { useEffect, useState } from "react";
import { useRoom } from "../../store/room";
import { expectedPosition, serverNow } from "./live";

function useTicker(active: boolean, ms: number) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick((n) => n + 1), ms);
    return () => clearInterval(id);
  }, [active, ms]);
}

// Where the room's song is right now, worked out from the server clock.
export function useRoomPosition() {
  const playback = useRoom((s) => s.playback);
  useTicker(!!playback?.isPlaying, 250);
  return playback ? expectedPosition(playback) : 0;
}

// Milliseconds left on the server cooldown after someone changed playback.
export function useCooldown() {
  const lockedUntil = useRoom((s) => s.playback?.lockedUntil ?? 0);
  const [left, setLeft] = useState(0);

  useEffect(() => {
    const update = () => setLeft(Math.max(0, lockedUntil - serverNow()));
    update();
    if (lockedUntil <= serverNow()) return;
    const id = setInterval(update, 100);
    return () => clearInterval(id);
  }, [lockedUntil]);

  return left;
}
