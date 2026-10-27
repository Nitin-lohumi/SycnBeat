import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HiCheck, HiMusicalNote, HiOutlineBell, HiOutlineBellSlash } from "react-icons/hi2";
import { cn } from "../../lib/utils";
import { timeAgo } from "../../lib/time";
import { MOCK_NOTIFICATIONS } from "../../mocks/social";
import type { AppNotification } from "../../types/social";
import HeaderPopover, { PanelEmpty, PanelHeader } from "../layout/HeaderPopover";
import UserAvatar from "../UserAvatar";

// Har type ka chhota icon avatar ke corner pe
const TYPE_BADGE = {
  FRIEND_ACCEPTED: { icon: HiCheck, className: "bg-emerald-500" },
  ROOM_INVITE: { icon: HiMusicalNote, className: "bg-fuchsia-500" },
} as const;

function NotificationText({ n }: { n: AppNotification }) {
  const name = <span className="font-medium text-white">{n.actor.name}</span>;
  switch (n.type) {
    case "FRIEND_ACCEPTED":
      return <>{name} accepted your friend request</>;
    case "ROOM_INVITE":
      return (
        <>
          {name} invited you to <span className="font-medium text-white">{n.room.name}</span>
        </>
      );
  }
}

export default function NotificationsMenu() {
  // TODO: API + socket se aayega
  const [items, setItems] = useState(MOCK_NOTIFICATIONS);
  const unread = items.filter((n) => !n.read).length;

  const markRead = (id: string) =>
    setItems((ns) => ns.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAllRead = () => setItems((ns) => ns.map((n) => ({ ...n, read: true })));
  const remove = (id: string) => setItems((ns) => ns.filter((n) => n.id !== id));

  return (
    <HeaderPopover label="Notifications" icon={HiOutlineBell} badge={unread}>
      {() => (
        <>
          <PanelHeader
            title="Notifications"
            action={
              unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-violet-300 transition-colors hover:text-violet-200"
                >
                  Mark all read
                </button>
              )
            }
          />

          <div className="overflow-y-auto p-2">
            <AnimatePresence initial={false}>
              {items.map((n) => {
                const badge = TYPE_BADGE[n.type];
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div
                      onClick={() => markRead(n.id)}
                      className={cn(
                        "flex cursor-default gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/4",
                        !n.read && "bg-violet-500/5",
                      )}
                    >
                      <div className="relative">
                        <UserAvatar user={n.actor} className="size-10" />
                        <span
                          className={cn(
                            "absolute -right-0.5 -bottom-0.5 grid size-4.5 place-items-center rounded-full text-white ring-2 ring-neutral-950",
                            badge.className,
                          )}
                        >
                          <badge.icon className="size-2.5" />
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white/60">
                          <NotificationText n={n} />
                        </p>
                        <p className="mt-0.5 text-xs text-white/30">{timeAgo(n.createdAt)}</p>

                        {n.type === "ROOM_INVITE" && (
                          <div className="mt-2 flex gap-2">
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => remove(n.id)}
                              className="h-7 rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 px-3.5 text-xs font-medium text-white"
                            >
                              Join room
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => remove(n.id)}
                              className="h-7 rounded-full bg-white/5 px-3.5 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                            >
                              Decline
                            </motion.button>
                          </div>
                        )}
                      </div>

                      {!n.read && (
                        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-fuchsia-500" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {items.length === 0 && <PanelEmpty icon={HiOutlineBellSlash} text="You're all caught up" />}
          </div>
        </>
      )}
    </HeaderPopover>
  );
}
