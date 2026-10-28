import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { HiXMark } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Spinner from "../../components/common/Spinner";
import UserAvatar from "../../components/UserAvatar";
import type { PublicUser } from "../../types/user";
import { useAcceptFriendRequest, useDeleteFriendRequest } from "../friends/hooks";
import type { FriendRequest } from "../friends/types";
import type { AppNotification } from "../notifications/types";
import InviteActions from "../rooms/components/InviteActions";

export const requestToastId = (requestId: string) => `friend-request-${requestId}`;

type CardProps = {
  toastId: string | number;
  user: PublicUser;
  children: ReactNode;
  actions?: ReactNode;
};

function ToastCard({ toastId, user, children, actions }: CardProps) {
  return (
    <div className="relative flex w-full items-start gap-3 rounded-2xl border border-white/10 bg-neutral-950/95 p-3.5 pr-10 text-white shadow-2xl shadow-black/60 backdrop-blur-xl sm:w-[356px]">
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={(e) => {
          e.stopPropagation();
          toast.dismiss(toastId);
        }}
        aria-label="Close"
        className="absolute top-2.5 right-2.5 grid size-6 place-items-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
      >
        <HiXMark className="size-4" />
      </motion.button>
      <motion.div initial={{ scale: 0.6, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 400, damping: 14 }}>
        <UserAvatar user={user} className="size-10" />
      </motion.div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white/60">{children}</p>
        {actions && <div className="mt-2.5 flex gap-2">{actions}</div>}
      </div>
    </div>
  );
}

function FriendRequestToast({ toastId, request }: { toastId: string | number; request: FriendRequest }) {
  const accept = useAcceptFriendRequest();
  const reject = useDeleteFriendRequest();
  const busy = accept.isPending || reject.isPending;
  const close = { onSettled: () => toast.dismiss(toastId) };

  return (
    <ToastCard
      toastId={toastId}
      user={request.user}
      actions={
        <>
          <motion.button
            whileTap={busy ? undefined : { scale: 0.95 }}
            disabled={busy}
            onClick={() => accept.mutate(request.id, close)}
            className="flex h-7 min-w-18 items-center justify-center rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 px-3.5 text-xs font-medium text-white disabled:opacity-70"
          >
            {accept.isPending ? <Spinner className="size-3" /> : "Accept"}
          </motion.button>
          <button
            disabled={busy}
            onClick={() => reject.mutate(request.id, close)}
            className="flex h-7 min-w-18 items-center justify-center rounded-full bg-white/5 px-3.5 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            {reject.isPending ? <Spinner className="size-3" /> : "Decline"}
          </button>
        </>
      }
    >
      <span className="font-medium text-white">{request.user.name}</span> sent you a friend request
    </ToastCard>
  );
}

export function showFriendRequestToast(request: FriendRequest) {
  toast.custom((id) => <FriendRequestToast toastId={id} request={request} />, {
    id: requestToastId(request.id),
    duration: 10_000,
  });
}

export function showRoomInviteToast(n: AppNotification) {
  if (!n.room) return;
  const room = n.room;
  toast.custom(
    (id) => (
      <ToastCard toastId={id} user={n.actor} actions={<InviteActions roomId={room.id} onDone={() => toast.dismiss(id)} />}>
        <span className="font-medium text-white">{n.actor.name}</span> invited you to listen in{" "}
        <span className="font-medium text-white">{room.name}</span> 🎧
      </ToastCard>
    ),
    { id: `room-invite-${room.id}`, duration: 15_000 },
  );
}

function MessageToast({ toastId, user, content, conversationId }: { toastId: string | number; user: PublicUser; content: string; conversationId: string }) {
  const navigate = useNavigate();
  return (
    <div
      role="button"
      onClick={() => {
        toast.dismiss(toastId);
        navigate(`/messages/${conversationId}`);
      }}
      className="w-full cursor-pointer"
    >
      <ToastCard toastId={toastId} user={user}>
        <span className="block font-medium text-white">{user.name}</span>
        <span className="line-clamp-2">{content}</span>
      </ToastCard>
    </div>
  );
}

export function showMessageToast(user: PublicUser, content: string, conversationId: string) {
  toast.custom((id) => <MessageToast toastId={id} user={user} content={content} conversationId={conversationId} />, {
    id: `dm-${conversationId}`,
    duration: 4000,
  });
}

export function showNotificationToast(n: AppNotification) {
  toast.custom((id) => (
    <ToastCard toastId={id} user={n.actor}>
      <span className="font-medium text-white">{n.actor.name}</span> accepted your friend request 🎉
    </ToastCard>
  ));
}
