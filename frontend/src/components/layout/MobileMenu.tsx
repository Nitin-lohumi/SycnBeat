import { useEffect } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { NavLink } from "react-router-dom";
import { HiArrowRightOnRectangle, HiXMark } from "react-icons/hi2";
import { useLogout } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";
import type { User } from "../../types/user";
import UserAvatar from "../UserAvatar";
import Logo from "./Logo";
import { NAV_ITEMS } from "./nav";

const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0 },
};

type Props = {
  open: boolean;
  onClose: () => void;
  user: User;
};

export default function MobileMenu({ open, onClose, user }: Props) {
  const logout = useLogout();

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const mq = window.matchMedia("(min-width: 768px)");
    const onResize = () => mq.matches && onClose();

    document.addEventListener("keydown", onKeyDown);
    mq.addEventListener("change", onResize);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
      mq.removeEventListener("change", onResize);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
          />

          <motion.aside
            key="panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="fixed inset-y-0 right-0 z-50 flex w-[85%] max-w-sm flex-col border-l border-white/10 bg-neutral-950 p-5 md:hidden"
          >
            <div className="flex items-center justify-between">
              <Logo />
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="grid size-9 place-items-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <HiXMark className="size-5" />
              </button>
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/3 p-3">
              <UserAvatar user={user} className="size-11" />
              <div className="min-w-0">
                <p className="truncate font-medium">{user.name}</p>
                <p className="truncate text-xs text-white/40">@{user.username}</p>
              </div>
            </div>

            <motion.nav
              variants={list}
              initial="hidden"
              animate="show"
              className="mt-6 flex flex-col gap-1"
            >
              {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                <motion.div key={to} variants={item}>
                  <NavLink
                    to={to}
                    end={end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-base transition-colors",
                        isActive
                          ? "bg-linear-to-r from-violet-500/20 to-fuchsia-500/10 text-white"
                          : "text-white/60 hover:bg-white/5 hover:text-white",
                      )
                    }
                  >
                    <Icon className="size-5" />
                    {label}
                  </NavLink>
                </motion.div>
              ))}
            </motion.nav>

            <button
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              className="mt-auto flex items-center justify-center gap-2 rounded-xl border border-red-500/20 py-3 text-sm text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
            >
              <HiArrowRightOnRectangle className="size-4" />
              {logout.isPending ? "Logging out…" : "Logout"}
            </button>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
