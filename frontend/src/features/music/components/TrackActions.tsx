import { motion } from "framer-motion";
import { HiCheck, HiMinus, HiOutlinePlus, HiPlus } from "react-icons/hi2";
import { cn } from "../../../lib/utils";
import { useAddToPlaylistDialog } from "../../../store/addToPlaylist";
import type { Track } from "../types";
import LikeButton from "./LikeButton";

const iconBtn =
  "grid size-9 shrink-0 place-items-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white";

export function AddToPlaylistButton({ track, className }: { track: Track; className?: string }) {
  const open = useAddToPlaylistDialog((s) => s.open);
  return (
    <button onClick={() => open(track)} aria-label="Add to playlist" title="Add to playlist" className={cn(iconBtn, className)}>
      <HiOutlinePlus className="size-5" />
    </button>
  );
}

// Default row actions on browse lists.
export function BrowseActions({ track }: { track: Track }) {
  return (
    <>
      <LikeButton track={track} className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:aria-pressed:opacity-100" />
      <AddToPlaylistButton track={track} className="hidden sm:grid sm:opacity-0 sm:group-hover:opacity-100" />
    </>
  );
}

export function ToggleInDraftButton({ added, onToggle }: { added: boolean; onToggle: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onToggle}
      aria-label={added ? "Remove from playlist" : "Add to playlist"}
      className={cn(
        "flex h-8 items-center gap-1 rounded-full px-3 text-xs font-medium transition-colors",
        added
          ? "bg-emerald-500/15 text-emerald-300 hover:bg-red-500/15 hover:text-red-300"
          : "bg-white/8 text-white/80 hover:bg-white/15 hover:text-white",
      )}
    >
      {added ? <HiCheck className="size-3.5" /> : <HiPlus className="size-3.5" />}
      {added ? "Added" : "Add"}
    </motion.button>
  );
}

export function RemoveTrackButton({ onRemove, label = "Remove" }: { onRemove: () => void; label?: string }) {
  return (
    <button onClick={onRemove} aria-label={label} title={label} className={cn(iconBtn, "hover:bg-red-500/10 hover:text-red-400")}>
      <HiMinus className="size-4.5" />
    </button>
  );
}
