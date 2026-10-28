import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { HiCheck, HiOutlineUserGroup } from "react-icons/hi2";
import { roomToast } from "../toast";
import EmptyState from "../../../components/common/EmptyState";
import ErrorState from "../../../components/common/ErrorState";
import Modal from "../../../components/common/Modal";
import { UserRowSkeleton } from "../../../components/common/Skeleton";
import Spinner from "../../../components/common/Spinner";
import UserAvatar from "../../../components/UserAvatar";
import { cn } from "../../../lib/utils";
import { useInvitable, useInviteFriends } from "../hooks";

export default function InviteDialog({ roomId, open, onClose }: { roomId: string; open: boolean; onClose: () => void }) {
  const friends = useInvitable(roomId, open);
  const invite = useInviteFriends();
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setPicked((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const close = () => {
    setPicked(new Set());
    onClose();
  };

  return (
    <Modal open={open} title="Invite friends" onClose={close}>
      <div className="p-2">
        {friends.isPending ? (
          Array.from({ length: 4 }, (_, i) => <UserRowSkeleton key={i} />)
        ) : friends.isError ? (
          <ErrorState onRetry={() => friends.refetch()} />
        ) : friends.data.length === 0 ? (
          <EmptyState
            icon={HiOutlineUserGroup}
            title="No friends yet"
            text="Only friends can join your rooms."
            action={
              <Link to="/friends" onClick={close} className="rounded-full bg-white/8 px-4 py-2 text-sm font-medium hover:bg-white/12">
                Find friends
              </Link>
            }
          />
        ) : (
          friends.data.map(({ user, status }) => {
            const selectable = status === "NONE";
            const on = picked.has(user.id);
            return (
              <button
                key={user.id}
                disabled={!selectable}
                onClick={() => toggle(user.id)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors enabled:hover:bg-white/5 disabled:cursor-default"
              >
                <UserAvatar user={user} className="size-10" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <p className="truncate text-xs text-white/40">@{user.username}</p>
                </div>
                {status === "NONE" ? (
                  <span
                    className={cn(
                      "grid size-6 place-items-center rounded-full ring-1 transition-colors",
                      on ? "bg-fuchsia-500 text-white ring-fuchsia-500" : "ring-white/20",
                    )}
                  >
                    {on && <HiCheck className="size-3.5" />}
                  </span>
                ) : (
                  <span className="rounded-full bg-white/6 px-2.5 py-1 text-[11px] text-white/50">
                    {status === "MEMBER" ? "In room" : "Invited"}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {friends.data?.some((f) => f.status === "NONE") && (
        <div className="sticky bottom-0 border-t border-white/10 bg-neutral-950 p-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={picked.size === 0 || invite.isPending}
            onClick={() =>
              invite.mutate(
                { id: roomId, userIds: [...picked] },
                {
                  onSuccess: (n) => {
                    roomToast.success(n === 1 ? "Invite sent" : `${n} invites sent`);
                    close();
                  },
                },
              )
            }
            className="flex h-11 w-full items-center justify-center rounded-xl bg-linear-to-r from-violet-500 to-fuchsia-500 text-sm font-medium text-white shadow-lg shadow-fuchsia-500/20 disabled:opacity-50"
          >
            {invite.isPending ? <Spinner className="size-4" /> : picked.size ? `Invite ${picked.size}` : "Pick friends to invite"}
          </motion.button>
        </div>
      )}
    </Modal>
  );
}
