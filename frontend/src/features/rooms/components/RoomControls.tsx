import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HiBackward, HiForward, HiLockClosed, HiPause, HiPlay, HiXMark } from "react-icons/hi2";
import Slider from "../../../components/common/Slider";
import Spinner from "../../../components/common/Spinner";
import { cn } from "../../../lib/utils";
import { usePlayer } from "../../../store/player";
import { useRoom, useRoomPermissions } from "../../../store/room";
import { formatDuration, trackKey } from "../../music/utils";
import type { RequestMessage } from "../types";
import { useCooldown, useRoomPosition } from "../useRoomClock";
import AvatarStack from "./AvatarStack";

const COOLDOWN_MAX = 3000;

// Ring that empties while the server cooldown runs.
function CooldownRing({ left }: { left: number }) {
  if (left <= 0) return null;
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" className="pointer-events-none absolute -inset-1 size-[calc(100%+0.5rem)] -rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-fuchsia-400" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(left, COOLDOWN_MAX) / COOLDOWN_MAX)} />
    </svg>
  );
}

function ControlButton({
  label,
  onClick,
  disabled,
  locked,
  children,
  className,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  locked?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.88 }}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={locked ? "The admin hasn't given you playback control" : label}
      className={cn("relative grid place-items-center rounded-full transition-colors disabled:cursor-not-allowed", className)}
    >
      {children}
      {locked && (
        <span className="absolute -right-0.5 -bottom-0.5 grid size-4 place-items-center rounded-full bg-neutral-800 text-white/60 ring-2 ring-neutral-950">
          <HiLockClosed className="size-2.5" />
        </span>
      )}
    </motion.button>
  );
}

export function RoomSeekBar({ className }: { className?: string }) {
  const playback = useRoom((s) => s.playback);
  const control = useRoom((s) => s.control);
  const { canControl } = useRoomPermissions();
  const position = useRoomPosition();
  const duration = playback?.track?.durationSec ?? 0;
  const time = (t: number) => <span className="w-10 shrink-0 text-[11px] text-white/40 tabular-nums">{formatDuration(t)}</span>;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {time(position)}
      {canControl ? (
        <Slider label="Seek" value={position} max={duration} onCommit={(v) => control({ action: "seek", position: v })} className="flex-1" />
      ) : (
        <div className="flex h-5 flex-1 items-center">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500"
              style={{ width: `${duration > 0 ? Math.min(100, (position / duration) * 100) : 0}%` }}
            />
          </div>
        </div>
      )}
      <span className="w-10 shrink-0 text-right text-[11px] text-white/40 tabular-nums">{formatDuration(duration)}</span>
    </div>
  );
}

export function RoomPlayButton({ size = "lg" }: { size?: "sm" | "lg" }) {
  const playback = useRoom((s) => s.playback);
  const control = useRoom((s) => s.control);
  const { canControl } = useRoomPermissions();
  const buffering = usePlayer((s) => s.isBuffering);
  const left = useCooldown();
  const playing = !!playback?.isPlaying;
  const Icon = playing ? HiPause : HiPlay;
  const lg = size === "lg";

  return (
    <ControlButton
      label={playing ? "Pause" : "Play"}
      onClick={() => control({ action: playing ? "pause" : "play" })}
      disabled={!canControl || left > 0}
      locked={!canControl}
      className={cn("bg-white text-black shadow-lg shadow-fuchsia-500/25 disabled:opacity-80", lg ? "size-16" : "size-10")}
    >
      <CooldownRing left={left} />
      {buffering && playing ? (
        <Spinner className={lg ? "size-6" : "size-4"} />
      ) : (
        <Icon className={cn(lg ? "size-7" : "size-5", !playing && "translate-x-px")} />
      )}
    </ControlButton>
  );
}

export function RoomControls({ className }: { className?: string }) {
  const control = useRoom((s) => s.control);
  const hasTrack = useRoom((s) => !!s.playback?.track);
  const { canControl } = useRoomPermissions();
  const left = useCooldown();
  const ghost = "size-11 text-white/70 hover:text-white disabled:opacity-30";

  return (
    <div className={cn("flex items-center justify-center gap-6", className)}>
      <ControlButton label="Previous" onClick={() => control({ action: "prev" })} disabled={!canControl || !hasTrack || left > 0} className={ghost}>
        <HiBackward className="size-7" />
      </ControlButton>
      <RoomPlayButton />
      <ControlButton label="Next" onClick={() => control({ action: "next" })} disabled={!canControl || left > 0} className={ghost}>
        <HiForward className="size-7" />
      </ControlButton>
    </div>
  );
}

// Pending "skip this song" requests for the song that is playing right now.
function useSkipRequests() {
  const chat = useRoom((s) => s.chat);
  const track = useRoom((s) => s.playback?.track);
  const key = track && trackKey(track);
  return chat.filter(
    (m): m is RequestMessage =>
      m.kind === "request" && m.status === "pending" && m.request.type === "skip" && trackKey(m.request.track) === key,
  );
}

// People with control see who wants a skip and decide right here.
export function SkipRequestsBadge() {
  const requests = useSkipRequests();
  const resolve = useRoom((s) => s.resolveRequest);
  const users = requests.map((r) => r.user);

  return (
    <AnimatePresence>
      {requests.length > 0 && (
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          title={`Wants to skip: ${users.map((u) => u.name).join(", ")}`}
          className="flex h-8 items-center gap-1.5 rounded-full bg-amber-400/10 pr-1 pl-2 text-xs text-amber-200 ring-1 ring-amber-400/25"
        >
          <AvatarStack users={users} max={3} />
          {requests.length === 1 ? `${users[0].name} wants` : `${requests.length} want`} to skip
          <button
            onClick={() => resolve(requests[0].id, true)}
            className="ml-1 h-6 rounded-full bg-amber-400/20 px-2.5 font-medium text-amber-100 transition-colors hover:bg-amber-400/30"
          >
            Skip
          </button>
          <button
            onClick={() => requests.forEach((r) => resolve(r.id, false))}
            aria-label="Ignore"
            className="grid size-6 place-items-center rounded-full text-amber-200/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <HiXMark className="size-3.5" />
          </button>
        </motion.span>
      )}
    </AnimatePresence>
  );
}

// Listeners without control ask; the admin or someone with control decides.
export function AskSkipButton() {
  const requestSkip = useRoom((s) => s.requestSkip);
  const hasTrack = useRoom((s) => !!s.playback?.track);
  const meId = useRoom((s) => s.meId);
  const asked = useSkipRequests().some((r) => r.user.id === meId);

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={requestSkip}
      disabled={!hasTrack || asked}
      title="Ask the admin to skip this song"
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-full px-3 text-xs transition-colors disabled:cursor-default",
        asked ? "bg-fuchsia-500/15 text-fuchsia-200 ring-1 ring-fuchsia-500/30" : "bg-white/6 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-40",
      )}
    >
      <HiForward className="size-3.5" />
      {asked ? "Asked to skip" : "Ask to skip"}
    </motion.button>
  );
}
