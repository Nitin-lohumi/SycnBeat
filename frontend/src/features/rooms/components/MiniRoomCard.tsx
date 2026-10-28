import { AnimatePresence, motion } from "framer-motion";
import { Link, useMatch } from "react-router-dom";
import { HiArrowsPointingOut, HiOutlineChatBubbleOvalLeft, HiSpeakerWave, HiSpeakerXMark, HiXMark } from "react-icons/hi2";
import { usePlayer } from "../../../store/player";
import { useRoom } from "../../../store/room";
import TrackCover from "../../music/components/TrackCover";
import { useRoomPosition } from "../useRoomClock";
import { LiveDot } from "./LiveBadge";

export function useMiniRoomVisible() {
  const onRoomScreen = !!useMatch("/rooms/:id");
  const live = useRoom((s) => s.status === "live");
  return live && !onRoomScreen;
}

const icon = "grid size-9 shrink-0 place-items-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white";

// Shown while you browse the site and stay in a room; music keeps playing.
export default function MiniRoomCard() {
  const visible = useMiniRoomVisible();
  return <AnimatePresence>{visible && <Card />}</AnimatePresence>;
}

function Card() {
  const room = useRoom((s) => s.room);
  const track = useRoom((s) => s.playback?.track ?? null);
  const listeners = useRoom((s) => s.presence?.listeners.length ?? 0);
  const unread = useRoom((s) => s.unread);
  const needsTap = useRoom((s) => s.needsTap);
  const unlockAudio = useRoom((s) => s.unlockAudio);
  const leave = useRoom((s) => s.leave);
  const muted = usePlayer((s) => s.muted || s.volume === 0);
  const toggleMute = usePlayer((s) => s.toggleMute);
  const position = useRoomPosition();
  const pct = track?.durationSec ? Math.min(100, (position / track.durationSec) * 100) : 0;

  if (!room) return null;

  return (
    <motion.div
      initial={{ y: "120%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "120%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 34 }}
      className="fixed inset-x-0 bottom-0 z-40 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-96 sm:p-0"
    >
      <div className="relative isolate overflow-hidden rounded-2xl border border-fuchsia-500/25 bg-neutral-950/90 shadow-2xl shadow-black/60 backdrop-blur-xl">
        {track?.thumbnailUrl && (
          <img src={track.thumbnailUrl} alt="" aria-hidden className="absolute inset-0 -z-10 size-full scale-150 object-cover opacity-20 blur-2xl" />
        )}

        <div className="flex items-center gap-3 p-2.5">
          <Link to={`/rooms/${room.id}`} className="flex min-w-0 flex-1 items-center gap-3" aria-label="Back to room">
            <div className="relative">
              <TrackCover src={track?.thumbnailUrl} className="size-12 rounded-xl" />
              {!!unread && (
                <span className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5 rounded-full bg-fuchsia-500 px-1.5 text-[10px] leading-4 font-semibold ring-2 ring-neutral-950">
                  <HiOutlineChatBubbleOvalLeft className="size-2.5" />
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-2">
                <LiveDot />
                <span className="truncate text-sm font-semibold">{room.name}</span>
              </p>
              <p className="truncate text-xs text-white/50">
                {track ? `${track.title} · ${track.artist ?? "Unknown"}` : "Nothing playing"} · {listeners} 🎧
              </p>
            </div>
          </Link>

          {needsTap ? (
            <button onClick={unlockAudio} className="h-8 shrink-0 rounded-full bg-white px-3 text-xs font-medium text-black">
              Tap to listen
            </button>
          ) : (
            <button onClick={toggleMute} aria-label={muted ? "Unmute room" : "Mute room for me"} title="Only mutes it for you" className={icon}>
              {muted ? <HiSpeakerXMark className="size-5" /> : <HiSpeakerWave className="size-5" />}
            </button>
          )}
          <Link to={`/rooms/${room.id}`} aria-label="Open room" title="Open room" className={`${icon} hidden sm:grid`}>
            <HiArrowsPointingOut className="size-4.5" />
          </Link>
          <button onClick={leave} aria-label="Leave room" title="Leave room" className={`${icon} hover:bg-red-500/10 hover:text-red-400`}>
            <HiXMark className="size-5" />
          </button>
        </div>

        <div className="h-0.5 bg-white/10">
          <div className="h-full bg-linear-to-r from-violet-500 to-fuchsia-500 transition-[width] duration-300 ease-linear" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </motion.div>
  );
}
