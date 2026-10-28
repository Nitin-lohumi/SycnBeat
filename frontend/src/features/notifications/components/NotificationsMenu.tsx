import { useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import {
  HiArrowRightOnRectangle,
  HiCheck,
  HiNoSymbol,
  HiOutlineBell,
  HiOutlineBellSlash,
  HiOutlineRadio,
  HiUserMinus,
  HiUserPlus,
} from "react-icons/hi2";
import InviteActions from "../../rooms/components/InviteActions";
import EmptyState from "../../../components/common/EmptyState";
import ErrorState from "../../../components/common/ErrorState";
import { UserRowSkeleton } from "../../../components/common/Skeleton";
import HeaderPopover, { PanelHeader } from "../../../components/layout/HeaderPopover";
import UserAvatar from "../../../components/UserAvatar";
import { timeAgo } from "../../../lib/time";
import { cn } from "../../../lib/utils";
import { useCounts, useMarkAllRead, useNotifications } from "../hooks";
import type { AppNotification } from "../types";

const TYPE_BADGE = {
  FRIEND_ACCEPTED: { icon: HiCheck, className: "bg-emerald-500" },
  FRIEND_REMOVED: { icon: HiUserMinus, className: "bg-neutral-600" },
  YOU_REMOVED_FRIEND: { icon: HiUserMinus, className: "bg-neutral-600" },
  YOU_ADDED_FRIEND: { icon: HiUserPlus, className: "bg-violet-500" },
  ROOM_INVITE: { icon: HiOutlineRadio, className: "bg-fuchsia-500" },
  YOU_LEFT_ROOM: { icon: HiArrowRightOnRectangle, className: "bg-neutral-600" },
  YOU_WERE_REMOVED_FROM_ROOM: { icon: HiNoSymbol, className: "bg-red-500" },
} as const;

const INVITE_STATUS: Record<string, string> = {
  ACCEPTED: "Joined",
  REJECTED: "Declined",
  EXPIRED: "Expired",
  CANCELLED: "Expired",
};

const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

function NotificationText({ n }: { n: AppNotification }) {
  const name = <span className="font-medium text-white">{n.actor.name}</span>;
  const room = n.room?.name ?? "a room";
  switch (n.type) {
    case "FRIEND_ACCEPTED":
      return <>{name} accepted your friend request</>;
    case "FRIEND_REMOVED":
      return <>{name} removed you as a friend</>;
    case "YOU_REMOVED_FRIEND":
      return <>You removed {name} from your friends</>;
    case "YOU_ADDED_FRIEND":
      return <>You and {name} are now friends</>;
    case "ROOM_INVITE":
      return <>{name} invited you to <span className="font-medium text-white">{room}</span></>;
    case "YOU_LEFT_ROOM":
      return <>You left <span className="font-medium text-white">{room}</span></>;
    case "YOU_WERE_REMOVED_FROM_ROOM":
      return <>{name} removed you from <span className="font-medium text-white">{room}</span></>;
  }
}

export default function NotificationsMenu() {
  const { data: counts } = useCounts();

  return (
    <HeaderPopover label="Notifications" icon={HiOutlineBell} badge={counts?.notifications ?? 0}>
      {() => <NotificationsPanel />}
    </HeaderPopover>
  );
}

function NotificationsPanel() {
  const notifications = useNotifications();
  const markAllRead = useMarkAllRead();
  const { mutate } = markAllRead;

  const fresh = notifications.isFetchedAfterMount;
  const hasUnread = !!notifications.data?.some((n) => !n.readAt);

  useEffect(() => {
    if (fresh && hasUnread) mutate();
  }, [fresh, hasUnread, notifications.dataUpdatedAt, mutate]);

  return (
    <>
      <PanelHeader title="Notifications" loading={notifications.isFetching && !notifications.isPending} />

      <div className="overflow-y-auto p-2">
        {notifications.isPending ? (
          Array.from({ length: 3 }, (_, i) => <UserRowSkeleton key={i} />)
        ) : notifications.isError ? (
          <ErrorState onRetry={() => notifications.refetch()} />
        ) : notifications.data.length === 0 ? (
          <EmptyState icon={HiOutlineBellSlash} title="You're all caught up" text="Friend and room updates will show up here." />
        ) : (
          <motion.div variants={list} initial="hidden" animate="show">
            {notifications.data.map((n) => {
              const badge = TYPE_BADGE[n.type];
              const unread = fresh && !n.readAt;
              return (
                <motion.div
                  key={n.id}
                  variants={item}
                  className={cn(
                    "flex gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/4",
                    unread && "bg-violet-500/6",
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
                    <p className="mt-0.5 text-xs text-white/30">
                      {timeAgo(n.createdAt)}
                      {n.type === "ROOM_INVITE" && n.inviteStatus && INVITE_STATUS[n.inviteStatus] && (
                        <> · {INVITE_STATUS[n.inviteStatus]}</>
                      )}
                    </p>
                    {n.type === "ROOM_INVITE" && n.room && n.inviteStatus === "PENDING" && (
                      <div className="mt-2">
                        <InviteActions roomId={n.room.id} />
                      </div>
                    )}
                  </div>

                  {unread && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-fuchsia-500 shadow-[0_0_8px] shadow-fuchsia-500" />}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </>
  );
}
