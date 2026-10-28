import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { IconType } from "react-icons";
import {
  HiOutlineChatBubbleOvalLeft,
  HiOutlineMusicalNote,
  HiOutlineQueueList,
  HiOutlineRadio,
} from "react-icons/hi2";
import Container from "../components/layout/Container";
import { GradientText } from "../components/layout/Page";
import UserAvatar from "../components/UserAvatar";
import { useMe } from "../hooks/useAuth";
import { ease } from "../lib/motion";
import { timeAgo } from "../lib/time";
import { useConversations } from "../features/chat/hooks";
import { LiveDot } from "../features/rooms/components/LiveBadge";
import { useRooms } from "../features/rooms/hooks";

const SHORTCUTS: { to: string; label: string; icon: IconType }[] = [
  { to: "/songs", label: "Songs", icon: HiOutlineMusicalNote },
  { to: "/rooms", label: "Rooms", icon: HiOutlineRadio },
  { to: "/playlists", label: "Playlists", icon: HiOutlineQueueList },
  { to: "/messages", label: "Messages", icon: HiOutlineChatBubbleOvalLeft },
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

const rise = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.08 + i * 0.06, duration: 0.5, ease },
});

export default function HomePage() {
  const { data: user } = useMe();
  const rooms = useRooms();
  const chats = useConversations();

  const live = [...(rooms.data?.owned ?? []), ...(rooms.data?.joined ?? [])].filter((r) => r.isLive).slice(0, 4);
  const recent = (chats.data ?? []).slice(0, 3);

  return (
    <Container className="max-w-5xl py-8 sm:py-12">
      <motion.div {...rise(0)}>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {greeting()}, <GradientText>{user?.name.split(" ")[0]}</GradientText>
        </h1>
        <p className="mt-1.5 text-white/50">What are we listening to today?</p>
      </motion.div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SHORTCUTS.map(({ to, label, icon: Icon }, i) => (
          <motion.div key={to} {...rise(i + 1)} whileHover={{ y: -3 }}>
            <Link
              to={to}
              className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/2 p-4 transition-colors hover:border-violet-400/30 hover:bg-violet-500/5"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-violet-500/10 text-violet-300 transition-transform group-hover:scale-110">
                <Icon className="size-5" />
              </span>
              <span className="font-medium">{label}</span>
            </Link>
          </motion.div>
        ))}
      </div>

      {live.length > 0 && (
        <Section title="Live now" index={5}>
          <div className="grid gap-2 sm:grid-cols-2">
            {live.map((r) => (
              <Link
                key={r.id}
                to={`/rooms/${r.id}`}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/2 px-3.5 py-3 transition-colors hover:border-fuchsia-500/30"
              >
                <LiveDot />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{r.name}</span>
                  <span className="block truncate text-xs text-white/40">
                    {r.nowPlaying ? r.nowPlaying.title : "Nothing playing yet"}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-white/40">{r.listenerCount} 🎧</span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {recent.length > 0 && (
        <Section title="Recent chats" index={6} action={<Link to="/messages" className="text-xs text-violet-300 hover:text-violet-200">See all</Link>}>
          <div className="divide-y divide-white/5 rounded-xl border border-white/10 bg-white/2">
            {recent.map((c) => (
              <Link key={c.id} to={`/messages/${c.id}`} className="flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-white/3">
                <UserAvatar user={c.user} className="size-9" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{c.user.name}</span>
                  <span className={c.unread ? "block truncate text-xs text-white/80" : "block truncate text-xs text-white/40"}>
                    {c.lastMessage?.content}
                  </span>
                </span>
                {c.lastMessageAt && <span className="shrink-0 text-[11px] text-white/30">{timeAgo(c.lastMessageAt)}</span>}
              </Link>
            ))}
          </div>
        </Section>
      )}
    </Container>
  );
}

function Section({ title, index, action, children }: { title: string; index: number; action?: ReactNode; children: ReactNode }) {
  return (
    <motion.section {...rise(index)} className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium tracking-wider text-white/50 uppercase">{title}</h2>
        {action}
      </div>
      {children}
    </motion.section>
  );
}
