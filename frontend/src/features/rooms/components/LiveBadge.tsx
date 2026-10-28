import { motion } from "framer-motion";
import { cn } from "../../../lib/utils";

// Small green dot that slowly pulses while the room is live.
export function LiveDot({ className }: { className?: string }) {
  return (
    <span title="Live" className={cn("relative flex size-2 shrink-0", className)}>
      <motion.span
        className="absolute inset-0 rounded-full bg-emerald-400"
        animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
      />
      <motion.span
        className="relative size-2 rounded-full bg-emerald-400 shadow-[0_0_6px] shadow-emerald-400"
        animate={{ opacity: [1, 0.45, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </span>
  );
}

export default function LiveBadge({ live, className }: { live: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase",
        live ? "bg-red-500/15 text-red-300 ring-1 ring-red-500/30" : "bg-white/8 text-white/50",
        className,
      )}
    >
      <span className="relative flex size-1.5">
        {live && <span className="absolute inset-0 animate-ping rounded-full bg-red-400" />}
        <span className={cn("relative size-1.5 rounded-full", live ? "bg-red-400" : "bg-white/40")} />
      </span>
      {live ? "Live" : "Offline"}
    </span>
  );
}
