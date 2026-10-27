import { forwardRef, type ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
import UserAvatar from "../../../components/UserAvatar";
import { ease } from "../../../lib/motion";
import type { PublicUser } from "../../../types/user";

const card: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: Math.min(i, 10) * 0.04, duration: 0.4, ease },
  }),
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

type Props = {
  user: PublicUser;
  index: number;
  meta?: string;
  actions?: ReactNode;
  corner?: ReactNode;
};

// forwardRef so AnimatePresence popLayout can measure the exiting card.
const PersonCard = forwardRef<HTMLDivElement, Props>(function PersonCard(
  { user, index, meta, actions, corner },
  ref,
) {
  return (
    <motion.div
      ref={ref}
      layout
      custom={index}
      variants={card}
      initial="hidden"
      animate="show"
      exit="exit"
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/3 p-5 transition-colors hover:border-white/20"
    >
      <div className="pointer-events-none absolute -top-16 left-1/2 h-32 w-48 -translate-x-1/2 rounded-full bg-fuchsia-500/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
      {corner && <div className="absolute top-3 right-3">{corner}</div>}

      <div className="relative flex flex-col items-center text-center">
        <UserAvatar user={user} className="size-16 text-xl ring-2 ring-white/10" />
        <p className="mt-3 w-full truncate font-medium">{user.name}</p>
        <p className="w-full truncate text-xs text-white/40">@{user.username}</p>
        {meta && <p className="mt-1 text-[11px] text-white/30">{meta}</p>}
        {actions && <div className="mt-4 flex items-center justify-center gap-2">{actions}</div>}
      </div>
    </motion.div>
  );
});

export default PersonCard;
