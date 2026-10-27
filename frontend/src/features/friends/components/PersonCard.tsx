import type { ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
import UserAvatar from "../../../components/UserAvatar";
import { ease } from "../../../lib/motion";
import { cn } from "../../../lib/utils";
import type { PublicUser } from "../../../types/user";

const card: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: Math.min(i, 10) * 0.04, duration: 0.4, ease },
  }),
  exit: { opacity: 0, scale: 0.92, transition: { duration: 0.2 } },
};

type Props = {
  user: PublicUser;
  index: number;
  meta?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  dimmed?: boolean;
  compact?: boolean;
};

export default function PersonCard({ user, index, meta, actions, footer, dimmed, compact }: Props) {
  return (
    <motion.div
      layout="position"
      custom={index}
      variants={card}
      initial="hidden"
      animate="show"
      exit="exit"
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/3 transition-colors hover:border-white/20"
    >
      <div className="pointer-events-none absolute -top-16 left-1/2 h-32 w-48 -translate-x-1/2 rounded-full bg-fuchsia-500/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

      {/* Dim on an inner wrapper: framer controls the outer element's opacity. */}
      <div className={cn("flex flex-1 flex-col transition-opacity", dimmed && "pointer-events-none opacity-50")}>
        {compact ? (
          <>
            <div className="h-12 bg-linear-to-br from-violet-500/30 via-fuchsia-500/10 to-transparent transition-opacity duration-500 group-hover:opacity-80" />
            <div className="relative -mt-7 flex flex-1 flex-col items-center px-3 pb-3 text-center">
              <div className="rounded-full bg-linear-to-br from-violet-500 to-fuchsia-500 p-0.5 shadow-lg shadow-fuchsia-500/20 transition-transform duration-300 group-hover:scale-105">
                <UserAvatar user={user} className="size-13 text-lg ring-2 ring-neutral-950" />
              </div>
              <p className="mt-2 w-full truncate text-sm font-semibold">{user.name}</p>
              <p className="w-full truncate text-[11px] text-white/40">@{user.username}</p>
              {meta && (
                <span className="mt-2 max-w-full truncate rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/45 ring-1 ring-white/5">
                  {meta}
                </span>
              )}
              {actions && <div className="mt-3 flex items-center justify-center gap-2">{actions}</div>}
            </div>
          </>
        ) : (
          <div className="relative flex flex-1 flex-col items-center p-5 text-center">
            <UserAvatar
              user={user}
              className="size-16 text-xl ring-2 ring-white/10 transition-transform duration-300 group-hover:scale-105"
            />
            <p className="mt-3 w-full truncate font-medium">{user.name}</p>
            <p className="w-full truncate text-xs text-white/40">@{user.username}</p>
            {meta && <p className="mt-1 w-full truncate text-[11px] text-white/30">{meta}</p>}
            {actions && <div className="mt-4 flex items-center justify-center gap-2">{actions}</div>}
          </div>
        )}

        {footer && (
          <div
            className={cn(
              "relative flex items-center gap-2 border-t border-white/10",
              compact ? "p-2 *:flex-1" : "justify-between px-3 py-2.5",
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </motion.div>
  );
}
