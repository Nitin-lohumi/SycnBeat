import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { IconType } from "react-icons";
import {
  HiOutlineChatBubbleOvalLeft,
  HiOutlineFire,
  HiOutlineMusicalNote,
  HiOutlineQueueList,
  HiOutlineRadio,
  HiOutlineUserGroup,
  HiPlus,
} from "react-icons/hi2";
import { Skeleton } from "../components/common/Skeleton";
import Container from "../components/layout/Container";
import { GradientText } from "../components/layout/Page";
import UserAvatar from "../components/UserAvatar";
import { useMe } from "../hooks/useAuth";
import { ease } from "../lib/motion";
import { timeAgo } from "../lib/time";
import { cn } from "../lib/utils";
import { useConversations } from "../features/chat/hooks";
import { useFriends } from "../features/friends/hooks";
import PlaylistCard from "../features/music/components/PlaylistCard";
import { BrowseActions } from "../features/music/components/TrackActions";
import TrackList from "../features/music/components/TrackList";
import { useLibrary, useTrackSearch } from "../features/music/hooks";
import { LiveDot } from "../features/rooms/components/LiveBadge";
import { useRooms } from "../features/rooms/hooks";

const SHORTCUTS: { to: string; label: string; hint: string; icon: IconType }[] = [
  { to: "/songs", label: "Songs", hint: "Search & play", icon: HiOutlineMusicalNote },
  { to: "/rooms", label: "Rooms", hint: "Listen together", icon: HiOutlineRadio },
  { to: "/playlists", label: "Playlists", hint: "Your library", icon: HiOutlineQueueList },
  { to: "/messages", label: "Messages", hint: "Chat with friends", icon: HiOutlineChatBubbleOvalLeft },
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

const rise = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.05 + i * 0.05, duration: 0.5, ease },
});

export default function HomePage() {
  const { data: user } = useMe();

  return (
    <Container className="py-6 sm:py-8">
      <motion.div {...rise(0)} className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {greeting()}, <GradientText>{user?.name.split(" ")[0]}</GradientText>
          </h1>
          <p className="mt-1 text-sm text-white/50">What are we listening to today?</p>
        </div>
        <Link
          to="/rooms"
          className="flex h-10 items-center gap-1.5 rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 px-4 text-sm font-medium text-white shadow-lg shadow-fuchsia-500/20 transition-[filter] hover:brightness-110"
        >
          <HiPlus className="size-4" /> Start a room
        </Link>
      </motion.div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {SHORTCUTS.map(({ to, label, hint, icon: Icon }, i) => (
          <motion.div key={to} {...rise(i + 1)} whileHover={{ y: -3 }}>
            <Link
              to={to}
              className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/2 p-3.5 transition-colors hover:border-violet-400/30 hover:bg-violet-500/5"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-300 transition-transform group-hover:scale-110">
                <Icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-medium">{label}</span>
                <span className="block truncate text-xs text-white/40">{hint}</span>
              </span>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5 lg:gap-5">
        <Card title="Trending this week" icon={HiOutlineFire} index={5} className="lg:col-span-3" action={<SeeAll to="/songs" />}>
          <Trending />
        </Card>

        <div className="flex flex-col gap-4 lg:col-span-2 lg:gap-5">
          <Card title="Live now" icon={HiOutlineRadio} index={6} action={<SeeAll to="/rooms" />}>
            <LiveRooms />
          </Card>
          <Card title="Recent chats" icon={HiOutlineChatBubbleOvalLeft} index={7} action={<SeeAll to="/messages" />}>
            <RecentChats />
          </Card>
          <Card title="Friends" icon={HiOutlineUserGroup} index={8} action={<SeeAll to="/friends" />}>
            <Friends />
          </Card>
        </div>
      </div>

      <Card title="Your playlists" icon={HiOutlineQueueList} index={9} className="mt-4 lg:mt-5" action={<SeeAll to="/playlists" />}>
        <Playlists />
      </Card>
    </Container>
  );
}

function Card({ title, icon: Icon, index, action, className, children }: {
  title: string;
  icon: IconType;
  index: number;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.section {...rise(index)} className={cn("rounded-3xl border border-white/10 bg-white/2", className)}>
      <div className="flex h-13 items-center gap-2.5 border-b border-white/5 px-4">
        <span className="grid size-7 place-items-center rounded-full bg-violet-500/15 text-violet-300">
          <Icon className="size-4" />
        </span>
        <h2 className="font-semibold">{title}</h2>
        <span className="ml-auto">{action}</span>
      </div>
      <div className="p-2 sm:p-3">{children}</div>
    </motion.section>
  );
}

const SeeAll = ({ to }: { to: string }) => (
  <Link to={to} className="text-xs text-violet-300 transition-colors hover:text-violet-200">
    See all
  </Link>
);

function Hint({ children }: { children: ReactNode }) {
  return <p className="px-2 py-4 text-center text-sm text-white/40">{children}</p>;
}

function Trending() {
  const search = useTrackSearch("");
  return <TrackList tracks={search.tracks.slice(0, 8)} loading={search.isPending} showIndex trailing={(t) => <BrowseActions track={t} />} />;
}

function LiveRooms() {
  const rooms = useRooms();
  if (rooms.isPending) return <Rows count={2} />;
  const live = [...(rooms.data?.owned ?? []), ...(rooms.data?.joined ?? [])].filter((r) => r.isLive).slice(0, 3);
  if (live.length === 0) {
    return (
      <Hint>
        No rooms are live right now.{" "}
        <Link to="/rooms" className="text-violet-300 hover:text-violet-200">Start one</Link>
      </Hint>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      {live.map((r) => (
        <Link key={r.id} to={`/rooms/${r.id}`} className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-white/4">
          <LiveDot />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{r.name}</span>
            <span className="block truncate text-xs text-white/40">{r.nowPlaying ? r.nowPlaying.title : "Nothing playing yet"}</span>
          </span>
          <span className="shrink-0 text-xs text-white/40">{r.listenerCount} 🎧</span>
        </Link>
      ))}
    </div>
  );
}

function RecentChats() {
  const chats = useConversations();
  if (chats.isPending) return <Rows count={3} />;
  const recent = (chats.data ?? []).slice(0, 3);
  if (recent.length === 0) return <Hint>No chats yet. Say hi to a friend 👋</Hint>;
  return (
    <div className="flex flex-col gap-1">
      {recent.map((c) => (
        <Link key={c.id} to={`/messages/${c.id}`} className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-white/4">
          <UserAvatar user={c.user} className="size-9" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{c.user.name}</span>
            <span className={cn("block truncate text-xs", c.unread ? "text-white/80" : "text-white/40")}>{c.lastMessage?.content}</span>
          </span>
          {c.unread > 0 ? (
            <span className="grid h-4.5 min-w-4.5 place-items-center rounded-full bg-fuchsia-500 px-1 text-[10px] font-semibold">{c.unread}</span>
          ) : (
            c.lastMessageAt && <span className="shrink-0 text-[11px] text-white/30">{timeAgo(c.lastMessageAt)}</span>
          )}
        </Link>
      ))}
    </div>
  );
}

function Friends() {
  const friends = useFriends();
  if (friends.isPending) return <Rows count={1} />;
  const list = friends.data ?? [];
  if (list.length === 0) {
    return (
      <Hint>
        No friends yet. <Link to="/friends" className="text-violet-300 hover:text-violet-200">Find people</Link>
      </Hint>
    );
  }
  return (
    <div className="flex flex-wrap gap-3 px-2 py-1.5">
      {list.slice(0, 10).map(({ user }) => (
        <Link key={user.id} to="/friends" title={user.name} className="flex w-14 flex-col items-center gap-1 text-center">
          <UserAvatar user={user} className="size-11 transition-transform hover:scale-105" />
          <span className="w-full truncate text-[11px] text-white/60">{user.name.split(" ")[0]}</span>
        </Link>
      ))}
    </div>
  );
}

function Playlists() {
  const library = useLibrary();
  const grid = "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6";
  if (library.isPending) {
    return (
      <div className={grid}>
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-2xl" />
        ))}
      </div>
    );
  }
  if (!library.data) return null;
  const { liked, playlists } = library.data;
  return (
    <div className={grid}>
      <PlaylistCard liked index={0} to="/playlists/liked" name="Liked Songs" trackCount={liked.trackCount} covers={liked.covers} />
      {playlists.slice(0, 5).map((p, i) => (
        <PlaylistCard key={p.id} index={i + 1} playlistId={p.id} to={`/playlists/${p.id}`} name={p.name} trackCount={p.trackCount} covers={p.covers} />
      ))}
      {playlists.length < 5 && (
        <Link
          to="/playlists/new"
          className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 text-white/50 transition-colors hover:border-violet-400/50 hover:text-white"
        >
          <HiPlus className="size-6" />
          <span className="text-sm">New playlist</span>
        </Link>
      )}
    </div>
  );
}

function Rows({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-2 p-2">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
