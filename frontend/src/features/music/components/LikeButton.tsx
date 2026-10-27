import { AnimatePresence, motion } from "framer-motion";
import { HiHeart, HiOutlineHeart } from "react-icons/hi2";
import { cn } from "../../../lib/utils";
import { useLikedKeys, useToggleLike } from "../hooks";
import type { Track } from "../types";
import { toRef, trackKey } from "../utils";

export default function LikeButton({ track, className, iconClassName = "size-5" }: {
  track: Track;
  className?: string;
  iconClassName?: string;
}) {
  const { data: likedKeys } = useLikedKeys();
  const toggle = useToggleLike();
  const liked = !!likedKeys?.has(trackKey(track));

  return (
    <motion.button
      whileTap={{ scale: 0.8 }}
      onClick={(e) => {
        e.stopPropagation();
        toggle.mutate({ track: toRef(track), liked: !liked });
      }}
      aria-label={liked ? "Remove from Liked Songs" : "Add to Liked Songs"}
      aria-pressed={liked}
      className={cn(
        "relative grid size-9 shrink-0 place-items-center rounded-full transition-colors",
        liked ? "text-fuchsia-400" : "text-white/40 hover:text-white",
        className,
      )}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={String(liked)}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 18 }}
        >
          {liked ? <HiHeart className={iconClassName} /> : <HiOutlineHeart className={iconClassName} />}
        </motion.span>
      </AnimatePresence>
      {liked && toggle.variables?.liked && (
        <motion.span
          key={toggle.submittedAt}
          initial={{ scale: 0.6, opacity: 0.6 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-fuchsia-400"
        />
      )}
    </motion.button>
  );
}
