import { useState } from "react";
import { motion } from "framer-motion";
import { HiOutlineChatBubbleOvalLeft, HiOutlineUserMinus } from "react-icons/hi2";
import { toast } from "sonner";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import Spinner from "../../../components/common/Spinner";
import { useUnfriend } from "../hooks";
import type { Friend } from "../types";
import PersonCard from "./PersonCard";

export default function FriendCard({ friend, index }: { friend: Friend; index: number }) {
  const [confirming, setConfirming] = useState(false);
  const unfriend = useUnfriend();
  const { user } = friend;

  const since = new Date(friend.since).toLocaleDateString("en", { month: "short", year: "numeric" });

  return (
    <>
      <PersonCard
        compact
        index={index}
        user={user}
        meta={`Since ${since}`}
        dimmed={unfriend.isPending}
        footer={
          <>
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => setConfirming(true)}
              className="flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-full bg-white/5 px-2 text-xs font-medium text-white/60 ring-1 ring-white/10 transition-colors hover:bg-red-500/10 hover:text-red-400 hover:ring-red-500/30"
            >
              {unfriend.isPending ? <Spinner className="size-3.5" /> : <HiOutlineUserMinus className="size-4 shrink-0" />}
              Remove
            </motion.button>

            {/* TODO: open the DM thread once 1:1 chat is built */}
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => toast("1:1 chat is coming soon 💬")}
              className="flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 px-2 text-xs font-medium text-white shadow-md shadow-fuchsia-500/20 transition-[filter] hover:brightness-110"
            >
              <HiOutlineChatBubbleOvalLeft className="size-4 shrink-0" />
              Chat
            </motion.button>
          </>
        }
      />

      <ConfirmDialog
        open={confirming}
        title={`Remove ${user.name}?`}
        description="They'll get a notification and you can add them again later."
        confirmLabel="Remove"
        onConfirm={() => unfriend.mutate(user.id)}
        onClose={() => setConfirming(false)}
      />
    </>
  );
}
