import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ease } from "../../lib/motion";
import { cn } from "../../lib/utils";
import RefetchBar from "./RefetchBar";

type Props = {
  header?: ReactNode;
  loading?: boolean;
  delay?: number;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
};

// Rounded surface with a fixed header; the body scrolls on its own.
export default function Panel({ header, loading = false, delay = 0, className, bodyClassName, children }: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease }}
      className={cn(
        "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/2",
        className,
      )}
    >
      {header && (
        <div className="relative flex h-14 shrink-0 items-center gap-3 border-b border-white/10 px-3 sm:px-4">
          {header}
          <RefetchBar active={loading} className="absolute inset-x-0 -bottom-px" />
        </div>
      )}
      {/* layoutScroll keeps drag-to-reorder measurements right inside the scroller. */}
      <motion.div layoutScroll className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain", bodyClassName)}>
        {children}
      </motion.div>
    </motion.section>
  );
}
