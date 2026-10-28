import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import EmptyState from "../../../components/common/EmptyState";
import ErrorState from "../../../components/common/ErrorState";
import { UserRowSkeleton } from "../../../components/common/Skeleton";
import UserAvatar from "../../../components/UserAvatar";
import { useMe } from "../../../hooks/useAuth";
import { timeAgo } from "../../../lib/time";
import { cn } from "../../../lib/utils";
import { useChatStore } from "../../../store/chat";
import { useConversations, usePrefetchChat } from "../hooks";

export default function ConversationList({ activeId, onNewChat }: { activeId?: string; onNewChat: () => void }) {
  const chats = useConversations();
  const { data: me } = useMe();
  const typing = useChatStore((s) => s.typing);
  const prefetch = usePrefetchChat();

  if (chats.isPending) return <div className="p-2">{Array.from({ length: 5 }, (_, i) => <UserRowSkeleton key={i} />)}</div>;
  if (chats.isError) return <ErrorState onRetry={() => chats.refetch()} />;
  if (chats.data.length === 0) {
    return (
      <EmptyState
        icon={HiOutlineChatBubbleLeftRight}
        title="No chats yet"
        text="Start a conversation with one of your friends."
        action={
          <button onClick={onNewChat} className="rounded-full bg-white/8 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/12">
            New chat
          </button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-1.5 p-2">
      <AnimatePresence initial={false}>
        {chats.data.map((c, i) => {
          const last = c.lastMessage;
          const isTyping = typing[c.id];
          const unread = c.unread > 0;
          return (
            <motion.div
              key={c.id}
              layout="position"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 10) * 0.02 } }}
            >
              <Link
                to={`/messages/${c.id}`}
                onMouseEnter={() => prefetch(c.id)}
                onTouchStart={() => prefetch(c.id)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-2.5 py-2.5 transition-colors",
                  activeId === c.id
                    ? "border-violet-500/30 bg-violet-500/8"
                    : "border-white/6 bg-white/2 hover:border-white/12 hover:bg-white/4",
                )}
              >
                <UserAvatar user={c.user} className="size-11" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={cn("truncate text-sm", unread ? "font-semibold" : "font-medium")}>{c.user.name}</p>
                    {c.lastMessageAt && <span className="shrink-0 text-[11px] text-white/30">{timeAgo(c.lastMessageAt)}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={cn("min-w-0 flex-1 truncate text-xs", isTyping ? "text-violet-300" : unread ? "text-white/80" : "text-white/40")}>
                      {isTyping ? "typing…" : last ? `${last.senderId === me?.id ? "You: " : ""}${last.content}` : ""}
                    </p>
                    {unread && (
                      <span className="grid h-4.5 min-w-4.5 shrink-0 place-items-center rounded-full bg-fuchsia-500 px-1 text-[10px] font-semibold">
                        {c.unread > 9 ? "9+" : c.unread}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
