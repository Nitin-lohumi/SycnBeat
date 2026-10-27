import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HiOutlineMusicalNote, HiOutlinePlus } from "react-icons/hi2";
import EmptyState from "../../../components/common/EmptyState";
import Panel from "../../../components/common/Panel";
import { cn } from "../../../lib/utils";
import { useAddToPlaylistDialog } from "../../../store/addToPlaylist";
import { useCurrentTrack, usePlayer } from "../../../store/player";
import { trackKey } from "../utils";
import LikeButton from "./LikeButton";
import { PlayerControls, SeekBar, VolumeControl } from "./PlayerControls";
import TrackCover from "./TrackCover";
import TrackRow from "./TrackRow";

export function NowPlayingView({ variant = "panel" }: { variant?: "panel" | "sheet" }) {
  const track = useCurrentTrack();
  const isPlaying = usePlayer((s) => s.isPlaying);
  const index = usePlayer((s) => s.index);
  const queue = usePlayer((s) => s.queue);
  const upNext = queue.slice(index + 1, index + 6);
  const playQueue = usePlayer((s) => s.playQueue);
  const openAdd = useAddToPlaylistDialog((s) => s.open);
  const sheet = variant === "sheet";

  if (!track) {
    return (
      <div className="grid h-full place-items-center p-6">
        <EmptyState
          size="lg"
          icon={HiOutlineMusicalNote}
          title="Nothing playing yet"
          text="Pick any song from the list and it starts right here."
        />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", sheet ? "gap-6" : "gap-5 p-4 sm:p-5")}>
      <div className={cn("relative mx-auto w-full", sheet ? "max-w-sm" : "max-w-xs")}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={trackKey(track)}
            initial={{ opacity: 0, scale: 0.92, rotate: -2 }}
            animate={{ opacity: 1, scale: isPlaying ? 1 : 0.94, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="relative"
          >
            {track.thumbnailUrl && (
              <img
                src={track.thumbnailUrl}
                alt=""
                aria-hidden
                className="absolute inset-0 size-full scale-110 rounded-3xl object-cover opacity-50 blur-3xl"
              />
            )}
            <TrackCover src={track.thumbnailUrl} alt={track.title} className="relative aspect-square w-full rounded-3xl shadow-2xl shadow-black/60 ring-1 ring-white/10" />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <motion.p key={track.title} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cn("truncate font-semibold", sheet ? "text-xl" : "text-lg")}>
            {track.title}
          </motion.p>
          <p className="truncate text-sm text-white/50">{track.artist ?? "Unknown artist"}</p>
        </div>
        <button
          onClick={() => openAdd(track)}
          aria-label="Add to playlist"
          title="Add to playlist"
          className="grid size-9 shrink-0 place-items-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <HiOutlinePlus className="size-5" />
        </button>
        <LikeButton track={track} iconClassName="size-6" />
      </div>

      <div>
        <SeekBar />
        <PlayerControls size={sheet ? "lg" : "md"} className="mt-2" />
      </div>

      <VolumeControl className="hidden justify-center lg:flex" />

      {upNext.length > 0 && (
        <div>
          <p className="mb-1 px-2 text-xs font-medium tracking-wider text-white/40 uppercase">Up next</p>
          {upNext.map((t, i) => (
            <TrackRow key={trackKey(t)} track={t} index={i} onPlay={() => playQueue(queue, index + 1 + i)} />
          ))}
        </div>
      )}
    </div>
  );
}

// Desktop right-side panel; hides the mini player while mounted.
export default function NowPlayingPanel({ className }: { className?: string }) {
  const registerPanel = usePlayer((s) => s.registerPanel);
  useEffect(() => registerPanel(), [registerPanel]);

  return (
    <Panel
      delay={0.15}
      className={cn("hidden lg:col-span-2 lg:flex", className)}
      header={
        <p className="flex items-center gap-2 font-semibold">
          <span className="grid size-8 place-items-center rounded-full bg-violet-500/15 text-violet-300">
            <HiOutlineMusicalNote className="size-4" />
          </span>
          Now playing
        </p>
      }
    >
      <NowPlayingView />
    </Panel>
  );
}
