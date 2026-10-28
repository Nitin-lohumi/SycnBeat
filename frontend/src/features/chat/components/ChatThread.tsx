import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { HiOutlineChatBubbleLeftRight, HiPaperAirplane } from "react-icons/hi2";
import EmptyState from "../../../components/common/EmptyState";
import ErrorState from "../../../components/common/ErrorState";
import Spinner from "../../../components/common/Spinner";
import UserAvatar from "../../../components/UserAvatar";
import { useMe } from "../../../hooks/useAuth";
import { useInView } from "../../../hooks/useInView";
import { cn } from "../../../lib/utils";
import { useChatStore } from "../../../store/chat";
import { socket } from "../../realtime/socket";
import { useConversation, useMarkRead, useMessages, useSendMessage } from "../hooks";
import type { DirectMessage } from "../types";

const GROUP_MS = 2 * 60_000;

const sameDay = (a: string, b: string) => new Date(a).toDateString() === new Date(b).toDateString();
const clock = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86_400_000);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
}

export default function ChatThread({ id, back }: { id: string; back?: ReactNode }) {
  const conv = useConversation(id);
  const typing = useChatStore((s) => !!s.typing[id]);
  const setOpen = useChatStore((s) => s.setOpen);

  useEffect(() => {
    setOpen(id);
    return () => setOpen(null);
  }, [id, setOpen]);

  if (conv.isError) {
    return (
      <div className="grid h-full place-items-center p-6">
        <EmptyState icon={HiOutlineChatBubbleLeftRight} title="Chat not found" text="This chat doesn't exist or isn't yours." />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 px-3 sm:px-4">
        {back}
        {conv.data ? (
          <>
            <UserAvatar user={conv.data.user} className="size-9" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{conv.data.user.name}</p>
              <p className={cn("truncate text-[11px]", typing ? "text-violet-300" : "text-white/40")}>
                {typing ? "typing…" : `@${conv.data.user.username}`}
              </p>
            </div>
          </>
        ) : (
          <Spinner className="size-4" />
        )}
      </div>

      <MessageList id={id} />
      <Composer id={id} disabled={conv.data ? !conv.data.isFriend : true} />
    </div>
  );
}

function MessageList({ id }: { id: string }) {
  const { messages, isPending, isError, refetch, hasNextPage, isFetchingNextPage, fetchNextPage } = useMessages(id);
  const { data: me } = useMe();
  const { mutate: markRead } = useMarkRead();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [topRef, topInView] = useInView<HTMLDivElement>("120px");
  const [ready, setReady] = useState(false);
  const prev = useRef({ first: "", last: "", height: 0 });

  const unreadFromThem = messages.some((m) => m.senderId !== me?.id && !m.readAt);
  useEffect(() => {
    if (unreadFromThem && document.visibilityState === "visible") markRead(id);
    const onShow = () => document.visibilityState === "visible" && markRead(id);
    document.addEventListener("visibilitychange", onShow);
    return () => document.removeEventListener("visibilitychange", onShow);
  }, [id, unreadFromThem, markRead]);

  // First load: jump to the bottom. Older page: keep the view still. New message: follow if near the bottom.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || messages.length === 0) return;
    const first = messages[0].id;
    const last = messages[messages.length - 1].id;
    const p = prev.current;

    if (!p.last) {
      el.scrollTop = el.scrollHeight;
      setReady(true);
    } else if (first !== p.first && last === p.last) {
      el.scrollTop += el.scrollHeight - p.height;
    } else if (last !== p.last) {
      const nearBottom = p.height - el.scrollTop - el.clientHeight < 160;
      if (nearBottom || messages[messages.length - 1].senderId === me?.id) {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      }
    }
    prev.current = { first, last, height: el.scrollHeight };
  }, [messages, me?.id]);

  useEffect(() => {
    if (ready && topInView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [ready, topInView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const lastMine = [...messages].reverse().find((m) => m.senderId === me?.id);

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4">
      <div ref={topRef} className="flex h-8 items-center justify-center">
        {isFetchingNextPage && <Spinner className="size-4" />}
      </div>

      {isPending ? (
        <div className="grid h-40 place-items-center">
          <Spinner className="size-5" />
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : messages.length === 0 ? (
        <EmptyState icon={HiOutlineChatBubbleLeftRight} title="Say hi 👋" text="Your messages are saved, so you can pick up later." />
      ) : (
        <div className="flex flex-col">
          {messages.map((m, i) => (
            <Message key={m.id} msg={m} prev={messages[i - 1]} next={messages[i + 1]} mine={m.senderId === me?.id} showStatus={m === lastMine} />
          ))}
        </div>
      )}
    </div>
  );
}

type MessageProps = { msg: DirectMessage; prev?: DirectMessage; next?: DirectMessage; mine: boolean; showStatus: boolean };

function Message({ msg, prev, next, mine, showStatus }: MessageProps) {
  const newDay = !prev || !sameDay(prev.createdAt, msg.createdAt);
  const close = (a?: DirectMessage, b?: DirectMessage) =>
    !!a && !!b && a.senderId === b.senderId && sameDay(a.createdAt, b.createdAt) && Math.abs(+new Date(b.createdAt) - +new Date(a.createdAt)) < GROUP_MS;
  const groupedWithPrev = !newDay && close(prev, msg);
  const lastOfGroup = !close(msg, next);

  return (
    <>
      {newDay && (
        <p className="my-3 self-center rounded-full bg-white/4 px-3 py-1 text-[11px] text-white/40">{dayLabel(msg.createdAt)}</p>
      )}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: msg.pending ? 0.6 : 1, y: 0 }}
        className={cn("flex flex-col", mine ? "items-end" : "items-start", groupedWithPrev ? "mt-0.5" : "mt-2")}
      >
        <p
          className={cn(
            "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm wrap-break-word whitespace-pre-wrap",
            mine ? "bg-linear-to-br from-violet-500 to-fuchsia-500 text-white" : "bg-white/8 text-white/90",
            mine ? lastOfGroup && "rounded-br-md" : lastOfGroup && "rounded-bl-md",
          )}
        >
          {msg.content}
        </p>
        {(lastOfGroup || showStatus) && (
          <p className="mt-1 px-1 text-[10px] text-white/30">
            {clock(msg.createdAt)}
            {showStatus && mine && (
              <span className={msg.readAt ? "text-violet-300" : undefined}>
                {" · "}
                {msg.pending ? "Sending…" : msg.readAt ? "Seen" : "Sent"}
              </span>
            )}
          </p>
        )}
      </motion.div>
    </>
  );
}

function Composer({ id, disabled }: { id: string; disabled: boolean }) {
  const send = useSendMessage();
  const [text, setText] = useState("");
  const typingRef = useRef(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const setTyping = (isTyping: boolean) => {
    if (typingRef.current === isTyping) return;
    typingRef.current = isTyping;
    socket.emit("dm:typing", { conversationId: id, isTyping });
  };

  useEffect(
    () => () => {
      clearTimeout(stopTimer.current);
      if (typingRef.current) socket.emit("dm:typing", { conversationId: id, isTyping: false });
    },
    [id],
  );

  const submit = () => {
    const content = text.trim();
    if (!content) return;
    setTyping(false);
    setText("");
    send.mutate({ id, content, tempId: `temp-${Date.now()}` });
  };

  if (disabled) {
    return (
      <p className="shrink-0 border-t border-white/10 p-4 text-center text-xs text-white/40">
        You can only message people who are your friends.
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex shrink-0 items-end gap-2 border-t border-white/10 p-3"
    >
      <textarea
        value={text}
        rows={1}
        maxLength={2000}
        onChange={(e) => {
          setText(e.target.value);
          setTyping(!!e.target.value.trim());
          clearTimeout(stopTimer.current);
          stopTimer.current = setTimeout(() => setTyping(false), 2500);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Write a message…"
        className="max-h-32 min-h-10 flex-1 resize-none rounded-2xl border border-white/10 bg-white/4 px-3.5 py-2.5 text-base outline-none placeholder:text-white/30 focus:border-violet-500/50 sm:text-sm"
      />
      <motion.button
        whileTap={{ scale: 0.9 }}
        disabled={!text.trim()}
        aria-label="Send"
        className="grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/20 transition-opacity disabled:opacity-40"
      >
        <HiPaperAirplane className="size-4.5" />
      </motion.button>
    </form>
  );
}
