import { useState, type MouseEvent } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { HiPlay } from "react-icons/hi2";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Spinner from "../../../components/common/Spinner";
import { ease } from "../../../lib/motion";
import { qk } from "../../../lib/queryKeys";
import { usePlayer } from "../../../store/player";
import { getLikedTracks, getPlaylist } from "../api";
import { songCount } from "../utils";
import PlaylistCover from "./PlaylistCover";

type Props = {
  to: string;
  name: string;
  trackCount: number;
  covers: string[];
  index: number;
  liked?: boolean;
  playlistId?: string;
};

export default function PlaylistCard({ to, name, trackCount, covers, index, liked, playlistId }: Props) {
  const qc = useQueryClient();
  const playQueue = usePlayer((s) => s.playQueue);
  const [loading, setLoading] = useState(false);

  const play = async (e: MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const tracks = liked
        ? await qc.fetchQuery({ queryKey: qk.liked, queryFn: getLikedTracks })
        : (await qc.fetchQuery({ queryKey: qk.playlist(playlistId!), queryFn: () => getPlaylist(playlistId!) })).tracks;
      if (tracks.length) playQueue(tracks, 0);
    } catch {
      toast.error("Couldn't load this playlist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ delay: Math.min(index, 12) * 0.04, duration: 0.45, ease }}
    >
      <Link
        to={to}
        className="group block rounded-2xl border border-white/5 bg-white/2 p-3 transition-colors hover:border-white/15 hover:bg-white/5"
      >
        <div className="relative">
          <PlaylistCover covers={covers} liked={liked} className="aspect-square w-full shadow-lg shadow-black/40" />
          {trackCount > 0 && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={play}
              aria-label={`Play ${name}`}
              className="absolute right-2 bottom-2 grid size-11 place-items-center rounded-full bg-white text-black shadow-xl shadow-black/50 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:translate-y-2 sm:opacity-0"
            >
              {loading ? <Spinner className="size-4" /> : <HiPlay className="size-5 translate-x-px" />}
            </motion.button>
          )}
        </div>
        <p className="mt-3 truncate text-sm font-semibold">{name}</p>
        <p className="mt-0.5 text-xs text-white/40">{liked ? "Your favourites · " : ""}{songCount(trackCount)}</p>
      </Link>
    </motion.div>
  );
}
