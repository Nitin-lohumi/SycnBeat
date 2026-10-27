import { useCallback, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { IconType } from "react-icons";
import { useDismiss } from "../../hooks/useDismiss";
import { cn } from "../../lib/utils";
import RefetchBar from "../common/RefetchBar";
import IconButton from "./IconButton";

type Props = {
  label: string;
  icon: IconType;
  badge?: number;
  children: (close: () => void) => ReactNode;
};

export default function HeaderPopover({ label, icon: Icon, badge = 0, children }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  return (
    <div ref={ref} className="sm:relative">
      <IconButton
        label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(open && "bg-white/10 text-white")}
      >
        <Icon className="size-5" />
        <AnimatePresence>
          {badge > 0 && (
            <motion.span
              key={badge}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 18 }}
              className="absolute -top-0.5 -right-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-fuchsia-500 px-1 text-[10px] leading-none font-semibold text-white ring-2 ring-black"
            >
              <span className="absolute inset-0 animate-ping rounded-full bg-fuchsia-500 opacity-40 [animation-iteration-count:2]" />
              <span className="relative">{badge > 9 ? "9+" : badge}</span>
            </motion.span>
          )}
        </AnimatePresence>
      </IconButton>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label={label}
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-x-3 top-16 z-50 flex max-h-[min(600px,calc(100dvh-5rem))] origin-top flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/95 shadow-2xl shadow-black/60 backdrop-blur-xl sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-[380px] sm:origin-top-right"
          >
            {children(close)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PanelHeader({
  title,
  action,
  loading = false,
}: {
  title: string;
  action?: ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="relative flex items-center justify-between border-b border-white/10 px-4 py-3">
      <p className="font-semibold">{title}</p>
      {action}
      <RefetchBar active={loading} className="absolute inset-x-0 -bottom-px" />
    </div>
  );
}

export function PanelSection({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <section className="px-2 py-3">
      <p className="flex items-center gap-2 px-2 pb-2 text-xs font-medium tracking-wider text-white/40 uppercase">
        {title}
        {!!count && (
          <span className="rounded-full bg-fuchsia-500/15 px-1.5 py-0.5 text-[10px] text-fuchsia-300">
            {count}
          </span>
        )}
      </p>
      {children}
    </section>
  );
}
