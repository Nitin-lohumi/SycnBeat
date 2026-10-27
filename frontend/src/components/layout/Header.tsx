import { useCallback, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { NavLink } from "react-router-dom";
import { HiBars3 } from "react-icons/hi2";
import { useMe } from "../../hooks/useAuth";
import { ease } from "../../lib/motion";
import { cn } from "../../lib/utils";
import FriendRequestsMenu from "../../features/friends/components/FriendRequestsMenu";
import NotificationsMenu from "../../features/notifications/components/NotificationsMenu";
import Container from "./Container";
import IconButton from "./IconButton";
import Logo from "./Logo";
import MobileMenu from "./MobileMenu";
import UserMenu from "./UserMenu";
import { NAV_ITEMS } from "./nav";

export default function Header() {
  const { data: user } = useMe();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);


  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 8));

  if (!user) return null;

  return (
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease }}
        className={cn(
          "sticky top-0 z-40 border-b transition-[background-color,border-color] duration-300",
          scrolled
            ? "border-white/10 bg-black/70 backdrop-blur-xl"
            : "border-transparent bg-transparent",
        )}
      >
        <Container
          className={cn(
            "flex max-w-[1920px] items-center justify-between gap-4 px-3 transition-[height] duration-300 sm:px-4 md:grid md:grid-cols-[1fr_auto_1fr] lg:px-6",
            scrolled ? "h-14" : "h-16 sm:h-18",
          )}
        >
          <Logo />

          <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/3 p-1 md:flex">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className="relative rounded-full px-3 py-1.5 text-sm lg:px-4">
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-full bg-white/10 ring-1 ring-white/10"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span
                      className={cn(
                        "relative flex items-center gap-2 transition-colors",
                        isActive ? "text-white" : "text-white/50 hover:text-white",
                      )}
                    >
                      <Icon className="hidden size-4 lg:block" />
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-1 sm:gap-2">
            <FriendRequestsMenu />
            <NotificationsMenu />

            <div className="hidden md:block">
              <UserMenu user={user} />
            </div>

            <IconButton label="Open menu" onClick={() => setMobileOpen(true)} className="md:hidden">
              <HiBars3 className="size-6" />
            </IconButton>
          </div>
        </Container>
      </motion.header>

      <MobileMenu open={mobileOpen} onClose={closeMobile} user={user} />
    </>
  );
}
