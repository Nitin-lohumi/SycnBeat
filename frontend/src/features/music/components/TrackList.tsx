import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePlayer } from "../../../store/player";
import type { Track } from "../types";
import { trackKey } from "../utils";
import TrackRow, { TrackRowSkeleton } from "./TrackRow";

type Props = {
  tracks: Track[];
  loading?: boolean;
  showIndex?: boolean;
  trailing?: (track: Track, index: number) => ReactNode;
  empty?: ReactNode;
};

// Tapping a row plays it and makes this list the queue.
export default function TrackList({ tracks, loading, showIndex, trailing, empty }: Props) {
  const playQueue = usePlayer((s) => s.playQueue);

  if (loading) return <>{Array.from({ length: 8 }, (_, i) => <TrackRowSkeleton key={i} />)}</>;
  if (tracks.length === 0) return <>{empty}</>;

  return (
    <AnimatePresence initial={false}>
      {tracks.map((track, i) => (
        <motion.div
          key={trackKey(track)}
          layout="position"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 12) * 0.02 } }}
          exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }}
        >
          <TrackRow
            track={track}
            index={i}
            showIndex={showIndex}
            onPlay={() => playQueue(tracks, i)}
            trailing={trailing?.(track, i)}
          />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
