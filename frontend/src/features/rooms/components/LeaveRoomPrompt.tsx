import { AnimatePresence, motion } from "framer-motion";
import { HiOutlineRadio } from "react-icons/hi2";
import { usePlayer } from "../../../store/player";
import { useRoom } from "../../../store/room";

// Playing your own song while in a room means leaving the room first.
export default function LeaveRoomPrompt() {
  const pending = usePlayer((s) => s.pendingSolo);
  const clear = usePlayer((s) => s.clearPendingSolo);
  const roomName = useRoom((s) => s.room?.name);
  const leave = useRoom((s) => s.leave);
  const song = pending?.tracks[pending.index];

  const leaveAndPlay = () => {
    if (!pending) return;
    clear();
    leave();
    usePlayer.getState().playQueue(pending.tracks, pending.index);
  };

  return (
    <AnimatePresence>
      {pending && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={clear}
          className="fixed inset-0 z-60 grid place-items-end bg-black/60 p-4 backdrop-blur-sm sm:place-items-center"
        >
          <motion.div
            role="alertdialog"
            aria-label="Leave the room?"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl border border-white/10 bg-neutral-950 p-6 shadow-2xl shadow-black/60"
          >
            <span className="grid size-11 place-items-center rounded-2xl bg-fuchsia-500/15 text-fuchsia-300">
              <HiOutlineRadio className="size-5" />
            </span>
            <p className="mt-4 text-lg font-semibold">Leave the room to play this?</p>
            <p className="mt-2 text-sm text-white/50">
              You're listening in <span className="text-white">{roomName ?? "a room"}</span>. Playing{" "}
              <span className="text-white">"{song?.title}"</span> will take you out of it.
            </p>
            <div className="mt-6 flex gap-2">
              <button onClick={clear} className="h-10 flex-1 rounded-xl bg-white/5 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white">
                Stay
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={leaveAndPlay}
                className="h-10 flex-1 rounded-xl bg-linear-to-r from-violet-500 to-fuchsia-500 text-sm font-medium text-white"
              >
                Leave & play
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
