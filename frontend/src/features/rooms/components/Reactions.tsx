import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../../lib/utils";
import { useRoom } from "../../../store/room";
import { REACTIONS } from "../types";

export function ReactionBar({ className }: { className?: string }) {
  const react = useRoom((s) => s.react);
  return (
    <div className={cn("flex items-center justify-center gap-0.5 rounded-full bg-white/4 p-0.5 ring-1 ring-white/5", className)}>
      {REACTIONS.map((emoji) => (
        <motion.button
          key={emoji}
          whileHover={{ scale: 1.2, y: -2 }}
          whileTap={{ scale: 0.8 }}
          onClick={() => react(emoji)}
          aria-label={`React ${emoji}`}
          className="grid size-8 place-items-center rounded-full text-base transition-colors hover:bg-white/8"
        >
          {emoji}
        </motion.button>
      ))}
    </div>
  );
}

// Emojis float up over the stage when anyone reacts.
export function ReactionLayer() {
  const reactions = useRoom((s) => s.reactions);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      <AnimatePresence>
        {reactions.map((r) => (
          <motion.span
            key={r.id}
            initial={{ opacity: 0, y: 0, scale: 0.4 }}
            animate={{ opacity: [0, 1, 1, 0], y: -260, scale: [0.4, 1.3, 1, 0.9], x: [0, (r.x - 0.5) * 60, (r.x - 0.5) * -40] }}
            transition={{ duration: 2.2, ease: "easeOut" }}
            className="absolute bottom-16 text-3xl"
            style={{ left: `${10 + r.x * 80}%` }}
          >
            {r.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
