import { motion } from "framer-motion";
import { cn } from "../../../lib/utils";

const BARS = [0.8, 1.1, 0.7];

export default function PlayingBars({ paused = false, className }: { paused?: boolean; className?: string }) {
  return (
    <div className={cn("flex h-3.5 items-end gap-0.5", className)} aria-hidden>
      {BARS.map((duration, i) => (
        <motion.span
          key={i}
          className="h-full w-0.75 origin-bottom rounded-full bg-fuchsia-400"
          animate={paused ? { scaleY: 0.35 } : { scaleY: [0.3, 1, 0.5, 0.9, 0.3] }}
          transition={paused ? { duration: 0.3 } : { duration, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
        />
      ))}
    </div>
  );
}
