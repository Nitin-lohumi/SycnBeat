import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HiOutlineChatBubbleLeftRight, HiPaperAirplane } from "react-icons/hi2";
import EmptyState from "../../../components/common/EmptyState";
import UserAvatar from "../../../components/UserAvatar";
import { cn } from "../../../lib/utils";
import { socket } from "../../realtime/socket";
import { useRoom } from "../../../store/room";
import type { ChatMessage, SystemEvent } from "../types";
import { RequestLine } from "./RequestCard";

const clock = (at: number) => new Date(at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export default function ChatPanel() {
  const chat = useRoom((s) => s.chat);
  const meId = useRoom((s) => s.meId);
  const setChatOpen = useRoom((s) => s.setChatOpen);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChatOpen(true);
    return () => setChatOpen(false);
  }, [setChatOpen]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.length]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
        {chat.length === 0 ? (
          <EmptyState icon={HiOutlineChatBubbleLeftRight} title="Say hi 👋" text="Chat is live only while the room is on, and clears when it ends." />
        ) : (
          <div className="flex flex-col gap-1">
            <AnimatePresence initial={false}>
              {chat.map((m, i) => (
                <Message key={m.id} msg={m} prev={chat[i - 1]} mine={m.kind !== "system" && m.user.id === meId} meId={meId} />
              ))}
            </AnimatePresence>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <TypingLine />
      <Composer />
    </div>
  );
}

const ABOUT_ME: Record<SystemEvent, string> = {
  joined: "You joined the room",
  left: "You left the room",
  removed: "You were removed",
  admin: "You're now the admin 👑",
  back: "You're back as admin 👑",
};

function Message({ msg, prev, mine, meId }: { msg: ChatMessage; prev?: ChatMessage; mine: boolean; meId: string | null }) {
  if (msg.kind === "system") {
    const aboutMe = msg.event && msg.userId === meId;
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "my-1.5 self-center rounded-full px-3 py-1 text-center text-[11px]",
          aboutMe && (msg.event === "admin" || msg.event === "back") ? "bg-amber-400/10 text-amber-300" : "bg-white/4 text-white/40",
        )}
      >
        {aboutMe ? ABOUT_ME[msg.event!] : msg.text}
      </motion.p>
    );
  }
  if (msg.kind === "request") return <div className="my-1"><RequestLine msg={msg} /></div>;

  const grouped = prev?.kind === "text" && prev.user.id === msg.user.id && msg.at - prev.at < 120_000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn("flex items-end gap-2", mine && "flex-row-reverse", !grouped && "mt-2")}
    >
      <div className="w-7 shrink-0">{!grouped && !mine && <UserAvatar user={msg.user} className="size-7 text-[11px]" />}</div>
      <div className={cn("flex max-w-[78%] flex-col", mine && "items-end")}>
        {!grouped && (
          <p className="mb-0.5 px-1 text-[11px] text-white/40">
            {mine ? "You" : msg.user.name} · {clock(msg.at)}
          </p>
        )}
        <p
          className={cn(
            "rounded-2xl px-3 py-2 text-sm wrap-break-word whitespace-pre-wrap",
            mine ? "rounded-br-md bg-linear-to-br from-violet-500 to-fuchsia-500 text-white" : "rounded-bl-md bg-white/8 text-white/90",
          )}
        >
          {msg.text}
        </p>
      </div>
    </motion.div>
  );
}

function TypingLine() {
  const typing = useRoom((s) => s.typing);
  const presence = useRoom((s) => s.presence);
  const names = typing.map((id) => presence?.listeners.find((l) => l.user.id === id)?.user.name).filter(Boolean);
  const text = names.length === 0 ? "" : names.length === 1 ? `${names[0]} is typing` : `${names.length} people are typing`;

  return (
    <div className="h-5 shrink-0 px-4 text-[11px] text-white/40">
      <AnimatePresence>
        {text && (
          <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
            <span className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} className="size-1 rounded-full bg-white/50" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.12 }} />
              ))}
            </span>
            {text}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function Composer() {
  const sendChat = useRoom((s) => s.sendChat);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const typingRef = useRef(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const setTyping = (isTyping: boolean) => {
    if (typingRef.current === isTyping) return;
    typingRef.current = isTyping;
    socket.emit("room:typing", { isTyping });
  };

  useEffect(() => () => {
    clearTimeout(stopTimer.current);
    if (typingRef.current) socket.emit("room:typing", { isTyping: false });
  }, []);

  const send = async () => {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    setTyping(false);
    if (await sendChat(value)) setText("");
    setSending(false);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void send();
      }}
      className="flex shrink-0 items-end gap-2 border-t border-white/10 p-3"
    >
      <textarea
        value={text}
        rows={1}
        maxLength={500}
        onChange={(e) => {
          setText(e.target.value);
          setTyping(!!e.target.value.trim());
          clearTimeout(stopTimer.current);
          stopTimer.current = setTimeout(() => setTyping(false), 2500);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void send();
          }
        }}
        placeholder="Message the room…"
        className="max-h-28 min-h-10 flex-1 resize-none rounded-2xl border border-white/10 bg-white/4 px-3.5 py-2.5 text-sm outline-none placeholder:text-white/30 focus:border-violet-500/50"
      />
      <motion.button
        whileTap={{ scale: 0.9 }}
        disabled={!text.trim() || sending}
        aria-label="Send"
        className="grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/20 transition-opacity disabled:opacity-40"
      >
        <HiPaperAirplane className="size-4.5" />
      </motion.button>
    </form>
  );
}
