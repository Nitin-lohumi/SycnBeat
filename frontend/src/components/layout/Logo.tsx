import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaHeadphones } from "react-icons/fa6";
import { cn } from "../../lib/utils";

// Har bar ki alag duration -> bars ek saath nahi uchhalte, real equalizer jaisa lagta hai
const BARS = [0.9, 1.2, 0.75, 1.05];

function Equalizer({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-4 items-end gap-0.5", className)} aria-hidden>
      {BARS.map((duration, i) => (
        <motion.span
          key={i}
          className="w-0.5 origin-bottom rounded-full bg-fuchsia-400"
          style={{ height: "100%" }}
          animate={{ scaleY: [0.3, 1, 0.5, 0.85, 0.3] }}
          transition={{ duration, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
        />
      ))}
    </div>
  );
}

export default function Logo() {
  return (
    <Link to="/" className="group flex items-center gap-2.5">
      <motion.div
        whileHover={{ rotate: -8, scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-fuchsia-500/25"
      >
        <FaHeadphones size={16} />
      </motion.div>

      <span className="text-lg font-semibold tracking-tight">
        Sync
        <span className="bg-linear-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
          Beat
        </span>
      </span>

      <Equalizer className="hidden sm:flex" />
    </Link>
  );
}
