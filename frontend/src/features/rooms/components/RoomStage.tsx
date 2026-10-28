import { AnimatePresence, motion } from "framer-motion";
import { HiOutlineMusicalNote, HiPlus, HiSpeakerWave } from "react-icons/hi2";
import UserAvatar from "../../../components/UserAvatar";
import { cn } from "../../../lib/utils";
import { useRoom, useRoomPermissions } from "../../../store/room";
import LikeButton from "../../music/components/LikeButton";
import { VolumeControl } from "../../music/components/PlayerControls";
import TrackCover from "../../music/components/TrackCover";
import { trackKey } from "../../music/utils";
import { useRoomQueue } from "../hooks";
import { ReactionBar, ReactionLayer } from "./Reactions";
import { AskSkipButton, RoomControls, RoomSeekBar, SkipRequestsBadge } from "./RoomControls";

export default function RoomStage({ onAddSongs, className }: { onAddSongs: () => void; className?: string }) {
  const roomId = useRoom((s) => s.roomId);
  const track = useRoom((s) => s.playback?.track ?? null);
  const isPlaying = useRoom((s) => !!s.playback?.isPlaying);
  const needsTap = useRoom((s) => s.needsTap);
  const unlockAudio = useRoom((s) => s.unlockAudio);
  const { canQueue, canControl } = useRoomPermissions();
  const queue = useRoomQueue(roomId);
  const addedBy = track ? queue.data?.find((t) => trackKey(t) === trackKey(track))?.addedBy : null;

  return (
    <section className={cn("relative isolate flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/2", className)}>
      {track?.thumbnailUrl && (
        <img src={track.thumbnailUrl} alt="" aria-hidden className="absolute inset-0 -z-10 size-full scale-125 object-cover opacity-25 blur-3xl" />
      )}
      <div className="absolute inset-0 -z-10 bg-linear-to-b from-transparent via-neutral-950/40 to-neutral-950/90" />
      <ReactionLayer />

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto px-4 py-4 sm:px-8">
        {track ? (
          <>
            <div className="relative w-full max-w-[min(15rem,30dvh)]">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={trackKey(track)}
                  initial={{ opacity: 0, scale: 0.85, rotate: -4 }}
                  animate={{ opacity: 1, scale: isPlaying ? 1 : 0.93, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.85, rotate: 4 }}
                  transition={{ type: "spring", stiffness: 240, damping: 24 }}
                  className="relative"
                >
                  <div className={cn("absolute -inset-4 rounded-[2rem] bg-fuchsia-500/20 blur-2xl transition-opacity duration-700", isPlaying ? "opacity-100" : "opacity-0")} />
                  <TrackCover src={track.thumbnailUrl} alt={track.title} className="relative aspect-square w-full rounded-3xl shadow-2xl shadow-black/60 ring-1 ring-white/10" />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex w-full max-w-md items-start gap-3">
              <div className="min-w-0 flex-1 text-center">
                <motion.p key={track.title} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="truncate text-xl font-semibold">
                  {track.title}
                </motion.p>
                <p className="truncate text-sm text-white/50">{track.artist ?? "Unknown artist"}</p>
                {addedBy && (
                  <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-white/40">
                    <UserAvatar user={addedBy} className="size-4 text-[8px]" /> Added by {addedBy.name}
                  </p>
                )}
              </div>
              <LikeButton track={track} iconClassName="size-6" />
            </div>

            <div className="w-full max-w-md">
              <RoomSeekBar />
              <RoomControls className="mt-1" />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {canControl ? <SkipRequestsBadge /> : <AskSkipButton />}
              <span title="Only changes the volume for you" className="flex items-center">
                <VolumeControl />
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="relative grid size-20 place-items-center rounded-3xl bg-linear-to-br from-violet-500/20 to-fuchsia-500/15 ring-1 ring-white/10">
              <div className="absolute inset-0 -z-10 rounded-3xl bg-fuchsia-500/20 blur-2xl" />
              <HiOutlineMusicalNote className="size-9 text-violet-300" />
            </div>
            <p className="mt-5 text-lg font-medium">
              {queue.data?.length ? (canControl ? "Ready when you are" : "Waiting for the music") : "The queue is empty"}
            </p>
            <p className="mt-1 max-w-xs text-sm text-white/40">
              {queue.data?.length
                ? canControl
                  ? "Press play and everyone hears it at the same moment."
                  : "The admin will start the music soon."
                : canQueue
                  ? "Add a few songs or a whole playlist to get started."
                  : "Ask the admin to add songs, or request one yourself."}
            </p>
            <div className="mt-5 flex gap-2">
              {queue.data?.length ? (
                canControl && <RoomControls />
              ) : (
                <button
                  onClick={onAddSongs}
                  className="flex h-10 items-center gap-1.5 rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 px-4 text-sm font-medium text-white shadow-lg shadow-fuchsia-500/20"
                >
                  <HiPlus className="size-4" /> {canQueue ? "Add songs" : "Request a song"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex shrink-0 justify-center px-4 pb-3">
        <ReactionBar />
      </div>

      <AnimatePresence>
        {needsTap && track && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={unlockAudio}
            className="absolute inset-0 z-10 grid place-items-center bg-black/60 backdrop-blur-sm"
          >
            <span className="flex flex-col items-center gap-3">
              <motion.span
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 1.6 }}
                className="grid size-20 place-items-center rounded-full bg-white text-black shadow-2xl shadow-fuchsia-500/30"
              >
                <HiSpeakerWave className="size-8" />
              </motion.span>
              <span className="text-sm font-medium">Tap to start listening</span>
              <span className="text-xs text-white/50">Your browser needs one tap before it plays sound</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </section>
  );
}
