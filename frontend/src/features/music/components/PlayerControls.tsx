import { motion } from "framer-motion";
import {
  HiArrowPathRoundedSquare,
  HiBackward,
  HiForward,
  HiPause,
  HiPlay,
  HiSpeakerWave,
  HiSpeakerXMark,
} from "react-icons/hi2";
import Slider from "../../../components/common/Slider";
import Spinner from "../../../components/common/Spinner";
import { cn } from "../../../lib/utils";
import { usePlayer } from "../../../store/player";
import { formatDuration } from "../utils";

export function SeekBar({ className, compact = false }: { className?: string; compact?: boolean }) {
  const currentTime = usePlayer((s) => s.currentTime);
  const duration = usePlayer((s) => s.duration);
  const seek = usePlayer((s) => s.seek);

  const time = (t: number) => <span className="w-10 shrink-0 text-[11px] text-white/40 tabular-nums">{formatDuration(t)}</span>;

  if (compact) return <Slider label="Seek" value={currentTime} max={duration} onCommit={seek} className={className} />;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {time(currentTime)}
      <Slider label="Seek" value={currentTime} max={duration} onCommit={seek} className="flex-1" />
      <span className="w-10 shrink-0 text-right text-[11px] text-white/40 tabular-nums">{formatDuration(duration)}</span>
    </div>
  );
}

export function PlayPauseButton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const isPlaying = usePlayer((s) => s.isPlaying);
  const isBuffering = usePlayer((s) => s.isBuffering);
  const togglePlay = usePlayer((s) => s.togglePlay);
  const Icon = isPlaying ? HiPause : HiPlay;

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      onClick={(e) => {
        e.stopPropagation();
        togglePlay();
      }}
      aria-label={isPlaying ? "Pause" : "Play"}
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-white text-black shadow-lg shadow-fuchsia-500/20",
        size === "sm" && "size-9",
        size === "md" && "size-11",
        size === "lg" && "size-16",
      )}
    >
      {isBuffering && isPlaying ? (
        <Spinner className={size === "lg" ? "size-6" : "size-4"} />
      ) : (
        <Icon className={cn(size === "lg" ? "size-7" : "size-5", !isPlaying && "translate-x-px")} />
      )}
    </motion.button>
  );
}

const ghost = "grid place-items-center rounded-full text-white/70 transition-colors hover:text-white disabled:opacity-30";

export function PlayerControls({ size = "md", className }: { size?: "md" | "lg"; className?: string }) {
  const prev = usePlayer((s) => s.prev);
  const next = usePlayer((s) => s.next);
  const repeat = usePlayer((s) => s.repeat);
  const cycleRepeat = usePlayer((s) => s.cycleRepeat);
  const hasNext = usePlayer((s) => s.index + 1 < s.queue.length || s.repeat === "all");
  const icon = size === "lg" ? "size-7" : "size-6";

  return (
    <div className={cn("flex items-center justify-center", size === "lg" ? "gap-7" : "gap-5", className)}>
      <span className="size-9" />
      <motion.button whileTap={{ scale: 0.85 }} onClick={prev} aria-label="Previous" className={cn(ghost, "size-10")}>
        <HiBackward className={icon} />
      </motion.button>
      <PlayPauseButton size={size === "lg" ? "lg" : "md"} />
      <motion.button whileTap={{ scale: 0.85 }} onClick={next} disabled={!hasNext} aria-label="Next" className={cn(ghost, "size-10")}>
        <HiForward className={icon} />
      </motion.button>
      <button
        onClick={cycleRepeat}
        aria-label={`Repeat: ${repeat}`}
        title={`Repeat: ${repeat}`}
        className={cn(ghost, "relative size-9", repeat !== "off" && "text-fuchsia-400 hover:text-fuchsia-300")}
      >
        <HiArrowPathRoundedSquare className="size-5" />
        {repeat === "one" && <span className="absolute top-0.5 right-0.5 text-[9px] font-bold">1</span>}
        {repeat !== "off" && <span className="absolute bottom-0 size-1 rounded-full bg-fuchsia-400" />}
      </button>
    </div>
  );
}

export function VolumeControl({ className }: { className?: string }) {
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const setVolume = usePlayer((s) => s.setVolume);
  const toggleMute = usePlayer((s) => s.toggleMute);
  const silent = muted || volume === 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button onClick={toggleMute} aria-label={silent ? "Unmute" : "Mute"} className={cn(ghost, "size-8")}>
        {silent ? <HiSpeakerXMark className="size-5" /> : <HiSpeakerWave className="size-5" />}
      </button>
      <Slider label="Volume" value={silent ? 0 : volume} max={1} onChange={setVolume} className="w-24" />
    </div>
  );
}
