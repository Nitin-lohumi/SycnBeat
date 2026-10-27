import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  HiArrowRightOnRectangle,
  HiChevronDown,
  HiOutlineQueueList,
  HiOutlineUserGroup,
} from "react-icons/hi2";
import { useLogout } from "../../hooks/useAuth";
import { useDismiss } from "../../hooks/useDismiss";
import { cn } from "../../lib/utils";
import type { User } from "../../types/user";
import UserAvatar from "../UserAvatar";

const LINKS = [
  { to: "/friends", label: "Friends", icon: HiOutlineUserGroup },
  { to: "/playlists", label: "My playlists", icon: HiOutlineQueueList },
];

export default function UserMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const logout = useLogout();
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full p-0.5 pr-0.5 transition-colors hover:bg-white/5 lg:pr-2"
      >
        <UserAvatar user={user} />
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          className="hidden text-white/50 lg:block"
        >
          <HiChevronDown className="size-4" />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-64 origin-top-right overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/95 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 px-3 py-3">
              <UserAvatar user={user} className="size-10" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-white/40">@{user.username}</p>
              </div>
            </div>

            <div className="my-1 h-px bg-white/10" />

            {LINKS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}

            <div className="my-1 h-px bg-white/10" />

            {/* ProtectedRoute khud /login bhej dega jab "me" null hoga */}
            <button
              role="menuitem"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10",
                logout.isPending && "opacity-50",
              )}
            >
              <HiArrowRightOnRectangle className="size-4" />
              {logout.isPending ? "Logging out…" : "Logout"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
