import { AnimatePresence, motion } from "framer-motion";
import { HiBackward, HiForward, HiOutlinePlus, HiXMark } from "react-icons/hi2";
import { useIsDesktop } from "../../../hooks/useMediaQuery";
import { useAddToPlaylistDialog } from "../../../store/addToPlaylist";
import { useCurrentTrack, usePlayer } from "../../../store/player";
import LikeButton from "./LikeButton";
import { PlayPauseButton, SeekBar, VolumeControl } from "./PlayerControls";
import TrackCover from "./TrackCover";

export function useMiniPlayerVisible() {
  const track = useCurrentTrack();
  const panels = usePlayer((s) => s.panels);
  const isDesktop = useIsDesktop();
  return !!track && !(isDesktop && panels > 0);
}

const icon = "grid size-9 shrink-0 place-items-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white";

export default function MiniPlayer() {
  const visible = useMiniPlayerVisible();
  const track = useCurrentTrack();
  const { prev, next, close, setExpanded } = usePlayer.getState();
  const openAdd = useAddToPlaylistDialog((s) => s.open);

  return (
    <AnimatePresence>
      {visible && track && (
        <motion.div
          initial={{ y: "110%" }}
          animate={{ y: 0 }}
          exit={{ y: "110%" }}
          transition={{ type: "spring", stiffness: 380, damping: 36 }}
          className="fixed inset-x-0 bottom-0 z-40 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-4"
        >
          <div className="relative mx-auto max-w-[1920px] overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/90 shadow-2xl shadow-black/60 backdrop-blur-xl">
            <SeekBar compact className="absolute inset-x-0 top-0 z-10 h-2 sm:hidden" />

            <div className="flex h-16 items-center gap-3 px-2.5 sm:px-3">
              <button
                onClick={() => setExpanded(true)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left sm:flex-none sm:basis-1/4"
                aria-label="Open player"
              >
                <TrackCover src={track.thumbnailUrl} className="size-11 rounded-lg" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{track.title}</span>
                  <span className="block truncate text-xs text-white/40">{track.artist ?? "Unknown artist"}</span>
                </span>
              </button>

              <div className="hidden flex-1 flex-col items-center gap-0.5 sm:flex">
                <div className="flex items-center gap-2">
                  <button onClick={prev} aria-label="Previous" className={icon}>
                    <HiBackward className="size-5" />
                  </button>
                  <PlayPauseButton size="sm" />
                  <button onClick={next} aria-label="Next" className={icon}>
                    <HiForward className="size-5" />
                  </button>
                </div>
                <SeekBar className="w-full max-w-xl" />
              </div>

              <div className="flex shrink-0 items-center gap-0.5 sm:basis-1/4 sm:justify-end">
                <LikeButton track={track} />
                <button onClick={() => openAdd(track)} aria-label="Add to playlist" className={`${icon} hidden sm:grid`}>
                  <HiOutlinePlus className="size-5" />
                </button>
                <VolumeControl className="mx-2 hidden xl:flex" />
                <span className="sm:hidden">
                  <PlayPauseButton size="sm" />
                </span>
                <button onClick={close} aria-label="Close player" className={icon}>
                  <HiXMark className="size-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
