import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../lib/utils";

export default function RefetchBar({ active, className }: { active: boolean; className?: string }) {
  return (
    <div className={cn("h-0.5 w-full", className)}>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { delay: 0.2 } }}
            className="relative h-full overflow-hidden rounded-full bg-white/5"
          >
            <div className="absolute inset-y-0 w-1/3 animate-progress rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
