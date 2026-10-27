import { useEffect } from "react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { HiChevronDown } from "react-icons/hi2";
import { useCurrentTrack, usePlayer } from "../../../store/player";
import { NowPlayingView } from "./NowPlaying";

// Full-screen player opened from the mini player; swipe down to close.
export default function FullPlayer() {
  const expanded = usePlayer((s) => s.expanded);
  const setExpanded = usePlayer((s) => s.setExpanded);
  const track = useCurrentTrack();
  const open = expanded && !!track;
  const dragControls = useDragControls();

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && setExpanded(false);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setExpanded]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 320, damping: 34 }}
          drag="y"
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.6 }}
          onDragEnd={(_, info) => (info.offset.y > 120 || info.velocity.y > 600) && setExpanded(false)}
          className="fixed inset-0 z-50 overflow-hidden bg-neutral-950"
        >
          {track?.thumbnailUrl && (
            <img src={track.thumbnailUrl} alt="" aria-hidden className="absolute inset-0 size-full scale-125 object-cover opacity-30 blur-3xl" />
          )}
          <div className="absolute inset-0 bg-linear-to-b from-black/30 via-black/60 to-black" />

          <div className="relative mx-auto flex h-full max-w-md flex-col overflow-y-auto px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            {/* Only the top bar starts the swipe, so the seek slider still works. */}
            <div onPointerDown={(e) => dragControls.start(e)} className="shrink-0 touch-none pb-4">
              <div className="flex items-center justify-between py-2">
                <button
                  onClick={() => setExpanded(false)}
                  aria-label="Close player"
                  className="grid size-10 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <HiChevronDown className="size-6" />
                </button>
                <p className="text-xs font-medium tracking-widest text-white/50 uppercase">Now playing</p>
                <span className="size-10" />
              </div>
              <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/20" />
            </div>
            <div className="mt-2">
              <NowPlayingView variant="sheet" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
