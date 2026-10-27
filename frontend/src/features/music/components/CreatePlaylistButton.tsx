import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { HiPlus } from "react-icons/hi2";

const MotionLink = motion.create(Link);

export default function CreatePlaylistButton() {
  return (
    <MotionLink
      to="/playlists/new"
      whileTap={{ scale: 0.96 }}
      whileHover={{ y: -1 }}
      className="flex h-10 items-center gap-1.5 rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 px-4 text-sm font-medium text-white shadow-lg shadow-fuchsia-500/20"
    >
      <HiPlus className="size-4" />
      <span>
        Create<span className="hidden sm:inline"> playlist</span>
      </span>
    </MotionLink>
  );
}
