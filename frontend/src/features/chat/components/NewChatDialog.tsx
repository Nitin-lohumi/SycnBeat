import { Link } from "react-router-dom";
import { HiOutlineUserGroup } from "react-icons/hi2";
import EmptyState from "../../../components/common/EmptyState";
import ErrorState from "../../../components/common/ErrorState";
import Modal from "../../../components/common/Modal";
import { UserRowSkeleton } from "../../../components/common/Skeleton";
import Spinner from "../../../components/common/Spinner";
import UserAvatar from "../../../components/UserAvatar";
import { useFriends } from "../../friends/hooks";
import { useOpenChat } from "../hooks";

export default function NewChatDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const friends = useFriends();
  const openChat = useOpenChat();

  return (
    <Modal open={open} title="New chat" onClose={onClose}>
      <div className="p-2">
        {friends.isPending ? (
          Array.from({ length: 4 }, (_, i) => <UserRowSkeleton key={i} />)
        ) : friends.isError ? (
          <ErrorState onRetry={() => friends.refetch()} />
        ) : friends.data.length === 0 ? (
          <EmptyState
            icon={HiOutlineUserGroup}
            title="No friends yet"
            text="You can chat with people once they're your friends."
            action={
              <Link to="/friends" onClick={onClose} className="rounded-full bg-white/8 px-4 py-2 text-sm font-medium hover:bg-white/12">
                Find friends
              </Link>
            }
          />
        ) : (
          friends.data.map(({ user }) => (
            <button
              key={user.id}
              disabled={openChat.isPending}
              onClick={() => openChat.mutate(user.id, { onSuccess: onClose })}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors enabled:hover:bg-white/5"
            >
              <UserAvatar user={user} className="size-10" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-white/40">@{user.username}</p>
              </div>
              {openChat.isPending && openChat.variables === user.id && <Spinner className="size-4" />}
            </button>
          ))
        )}
      </div>
    </Modal>
  );
}
