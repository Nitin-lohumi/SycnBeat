import type { ReactNode } from "react";
import { HiPause, HiPlay } from "react-icons/hi2";
import { cn } from "../../../lib/utils";
import { usePlayer } from "../../../store/player";
import type { Track } from "../types";
import { formatDuration, trackKey } from "../utils";
import PlayingBars from "./PlayingBars";
import TrackCover from "./TrackCover";

type Props = {
  track: Track;
  index: number;
  onPlay?: () => void;
  leading?: ReactNode;
  trailing?: ReactNode;
  showIndex?: boolean;
};

export default function TrackRow({ track, index, onPlay, leading, trailing, showIndex = false }: Props) {
  const key = trackKey(track);
  const state = usePlayer((s) => {
    const current = s.queue[s.index];
    if (!current || trackKey(current) !== key) return "idle";
    return s.isPlaying ? "playing" : "paused";
  });
  const isCurrent = state !== "idle";

  return (
    <div
      onClick={onPlay}
      role={onPlay ? "button" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors",
        onPlay && "cursor-pointer",
        isCurrent ? "bg-white/6" : "hover:bg-white/4",
      )}
    >
      {leading}

      {showIndex && (
        <div className="hidden w-5 shrink-0 justify-center text-xs text-white/30 tabular-nums sm:flex">
          {isCurrent ? <PlayingBars paused={state === "paused"} /> : index + 1}
        </div>
      )}

      <div className="relative">
        <TrackCover src={track.thumbnailUrl} className="size-11 rounded-lg" />
        {onPlay && (
          <div
            className={cn(
              "absolute inset-0 grid place-items-center rounded-lg bg-black/50 text-white transition-opacity",
              isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
          >
            {state === "playing" ? <HiPause className="size-5" /> : <HiPlay className="size-5" />}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", isCurrent && "text-fuchsia-300")}>{track.title}</p>
        <p className="truncate text-xs text-white/40">{track.artist ?? "Unknown artist"}</p>
      </div>

      <span className="hidden shrink-0 text-xs text-white/30 tabular-nums sm:block">{formatDuration(track.durationSec)}</span>

      {trailing && (
        <div onClick={(e) => e.stopPropagation()} className="flex shrink-0 items-center gap-0.5">
          {trailing}
        </div>
      )}
    </div>
  );
}

export function TrackRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-2 py-1.5">
      <div className="size-11 animate-pulse rounded-lg bg-white/5" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-2/5 animate-pulse rounded bg-white/5" />
        <div className="h-2.5 w-1/4 animate-pulse rounded bg-white/5" />
      </div>
    </div>
  );
}
