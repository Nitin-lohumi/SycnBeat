import { AnimatePresence, motion } from "framer-motion";
import { HiCheck, HiOutlineUserPlus, HiUserGroup } from "react-icons/hi2";
import { cn } from "../../../lib/utils";
import { useAcceptFriendRequest, useDeleteFriendRequest, useSendFriendRequest } from "../hooks";
import type { SearchUser } from "../types";

const VARIANTS = {
  NONE: { label: "Add", icon: HiOutlineUserPlus, className: "bg-white text-black hover:bg-white/90" },
  OUTGOING: { label: "Requested", icon: HiCheck, className: "bg-white/5 text-white/50 hover:bg-white/10" },
  INCOMING: {
    label: "Accept",
    icon: HiCheck,
    className: "bg-linear-to-r from-violet-500 to-fuchsia-500 text-white shadow-md shadow-fuchsia-500/25",
  },
  FRIENDS: { label: "Friends", icon: HiUserGroup, className: "bg-emerald-500/10 text-emerald-300 cursor-default" },
} as const;

export default function RelationButton({ user }: { user: SearchUser }) {
  const send = useSendFriendRequest();
  const accept = useAcceptFriendRequest();
  const remove = useDeleteFriendRequest();

  const v = VARIANTS[user.status];
  const busy = send.isPending || accept.isPending || remove.isPending;

  function onClick() {
    if (busy) return;
    const requestId = user.requestId;
    if (user.status === "NONE") send.mutate(user.id);
    else if (user.status === "INCOMING" && requestId) accept.mutate({ requestId, userId: user.id, user });
    else if (user.status === "OUTGOING" && requestId)
      remove.mutate({ requestId, userId: user.id, incoming: false });
  }

  return (
    <motion.button
      whileTap={user.status === "FRIENDS" ? undefined : { scale: 0.92 }}
      onClick={onClick}
      title={user.status === "OUTGOING" ? "Cancel request" : undefined}
      className={cn(
        "flex h-8 w-27 items-center justify-center overflow-hidden rounded-full text-xs font-medium transition-colors",
        v.className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={user.status}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-1"
        >
          <v.icon className="size-3.5" /> {v.label}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
