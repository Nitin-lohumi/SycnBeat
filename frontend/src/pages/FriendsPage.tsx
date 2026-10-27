import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import {
  HiOutlineInbox,
  HiOutlineMagnifyingGlass,
  HiOutlinePaperAirplane,
  HiOutlineSparkles,
  HiOutlineUserGroup,
  HiOutlineUserMinus,
  HiOutlineUsers,
} from "react-icons/hi2";
import ConfirmDialog from "../components/common/ConfirmDialog";
import EmptyState from "../components/common/EmptyState";
import RefetchBar from "../components/common/RefetchBar";
import ErrorState from "../components/common/ErrorState";
import { Skeleton } from "../components/common/Skeleton";
import Container from "../components/layout/Container";
import PersonCard from "../features/friends/components/PersonCard";
import RelationButton from "../features/friends/components/RelationButton";
import RequestActions from "../features/friends/components/RequestActions";
import {
  useDeleteFriendRequest,
  useFriendRequests,
  useFriends,
  useUnfriend,
  useUserSearch,
} from "../features/friends/hooks";
import type { Friend } from "../features/friends/types";
import { useDebounce } from "../hooks/useDebounce";
import { ease } from "../lib/motion";
import { timeAgo } from "../lib/time";
import { cn } from "../lib/utils";

const TABS = [
  { id: "friends", label: "Friends", icon: HiOutlineUserGroup },
  { id: "requests", label: "Requests", icon: HiOutlineInbox },
  { id: "sent", label: "Sent", icon: HiOutlinePaperAirplane },
  { id: "discover", label: "Discover", icon: HiOutlineSparkles },
] as const;

type TabId = (typeof TABS)[number]["id"];

const GRID = "grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

export default function FriendsPage() {
  const [params, setParams] = useSearchParams();
  const tab: TabId = TABS.find((t) => t.id === params.get("tab"))?.id ?? "friends";
  const setTab = (id: TabId) => setParams(id === "friends" ? {} : { tab: id }, { replace: true });

  const friends = useFriends();
  const requests = useFriendRequests();

  const counts: Record<TabId, number | undefined> = {
    friends: friends.data?.length,
    requests: requests.data?.incoming.length,
    sent: requests.data?.outgoing.length,
    discover: undefined,
  };

  return (
    <Container className="py-10 sm:py-14">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Your{" "}
          <span className="bg-linear-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">people</span>
        </h1>
        <p className="mt-2 text-white/50">Add friends, then pull them into a room and listen together.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6, ease }}
        className="-mx-4 mt-8 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0"
      >
        <div className="inline-flex gap-1 rounded-full border border-white/10 bg-white/3 p-1">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            const count = counts[id];
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="relative rounded-full px-4 py-2 text-sm whitespace-nowrap"
              >
                {active && (
                  <motion.span
                    layoutId="friends-tab"
                    className="absolute inset-0 rounded-full bg-white/10 ring-1 ring-white/10"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span
                  className={cn(
                    "relative flex items-center gap-2 transition-colors",
                    active ? "text-white" : "text-white/50 hover:text-white",
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                  {!!count && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] leading-none",
                        id === "requests" ? "bg-fuchsia-500 text-white" : "bg-white/10 text-white/60",
                      )}
                    >
                      {count}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      <RefetchBar
        className="mt-6 max-w-md"
        active={
          (tab === "friends" && friends.isFetching && !friends.isPending) ||
          ((tab === "requests" || tab === "sent") && requests.isFetching && !requests.isPending)
        }
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease }}
          className="mt-6"
        >
          {tab === "friends" && <FriendsTab query={friends} onDiscover={() => setTab("discover")} />}
          {tab === "requests" && <RequestsTab query={requests} />}
          {tab === "sent" && <SentTab query={requests} onDiscover={() => setTab("discover")} />}
          {tab === "discover" && <DiscoverTab />}
        </motion.div>
      </AnimatePresence>
    </Container>
  );
}

function SearchInput({ value, onChange, placeholder, loading }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  loading?: boolean;
}) {
  return (
    <label className="mb-6 flex max-w-md items-center gap-2.5 rounded-2xl border border-white/10 bg-white/3 px-4 transition-colors focus-within:border-violet-500/50 focus-within:bg-white/5">
      <HiOutlineMagnifyingGlass className="size-4.5 shrink-0 text-white/40" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-white/30"
      />
      {loading && <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />}
    </label>
  );
}

function CardsSkeleton() {
  return (
    <div className={GRID}>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/3 p-5">
          <Skeleton className="size-16 rounded-full" />
          <Skeleton className="mt-3 h-3.5 w-24" />
          <Skeleton className="mt-2 h-2.5 w-16" />
          <Skeleton className="mt-4 h-8 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}

const GhostButton = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white/90"
  >
    {children}
  </motion.button>
);

function FriendsTab({ query, onDiscover }: { query: ReturnType<typeof useFriends>; onDiscover: () => void }) {
  const [filter, setFilter] = useState("");
  const [toRemove, setToRemove] = useState<Friend | null>(null);
  const unfriend = useUnfriend();

  if (query.isPending) return <CardsSkeleton />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;
  if (query.data.length === 0) {
    return (
      <EmptyState
        size="lg"
        icon={HiOutlineUserGroup}
        title="No friends yet"
        text="Find people you know and send them a request."
        action={<GhostButton onClick={onDiscover}><HiOutlineSparkles className="size-4" /> Find people</GhostButton>}
      />
    );
  }

  const f = filter.trim().toLowerCase();
  const visible = query.data.filter(
    ({ user }) => !f || user.name.toLowerCase().includes(f) || user.username.toLowerCase().includes(f),
  );

  return (
    <>
      <SearchInput value={filter} onChange={setFilter} placeholder="Filter your friends" />
      {visible.length === 0 ? (
        <EmptyState icon={HiOutlineUsers} title={`No friends match "${filter}"`} />
      ) : (
        <div className={GRID}>
          <AnimatePresence mode="popLayout">
            {visible.map((fr, i) => (
              <PersonCard
                key={fr.user.id}
                index={i}
                user={fr.user}
                meta={`Friends since ${new Date(fr.since).toLocaleDateString("en", { month: "short", year: "numeric" })}`}
                corner={
                  <button
                    onClick={() => setToRemove(fr)}
                    aria-label={`Unfriend ${fr.user.name}`}
                    className="grid size-8 place-items-center rounded-full text-white/40 transition-all hover:bg-red-500/10 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <HiOutlineUserMinus className="size-4" />
                  </button>
                }
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <ConfirmDialog
        open={!!toRemove}
        title={`Unfriend ${toRemove?.user.name ?? ""}?`}
        description="You can always send them a new request later."
        confirmLabel="Unfriend"
        onConfirm={() => toRemove && unfriend.mutate(toRemove.user.id)}
        onClose={() => setToRemove(null)}
      />
    </>
  );
}

function RequestsTab({ query }: { query: ReturnType<typeof useFriendRequests> }) {
  if (query.isPending) return <CardsSkeleton />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;
  if (query.data.incoming.length === 0) {
    return (
      <EmptyState size="lg" icon={HiOutlineInbox} title="No pending requests" text="When someone adds you, it'll pop up here instantly." />
    );
  }

  return (
    <div className={GRID}>
      <AnimatePresence mode="popLayout">
        {query.data.incoming.map((r, i) => (
          <PersonCard
            key={r.id}
            index={i}
            user={r.user}
            meta={`Sent ${timeAgo(r.createdAt)}`}
            actions={<RequestActions request={r} />}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function SentTab({ query, onDiscover }: { query: ReturnType<typeof useFriendRequests>; onDiscover: () => void }) {
  const cancel = useDeleteFriendRequest();

  if (query.isPending) return <CardsSkeleton />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;
  if (query.data.outgoing.length === 0) {
    return (
      <EmptyState
        size="lg"
        icon={HiOutlinePaperAirplane}
        title="No sent requests"
        text="Requests you send will wait here until they're accepted."
        action={<GhostButton onClick={onDiscover}><HiOutlineSparkles className="size-4" /> Find people</GhostButton>}
      />
    );
  }

  return (
    <div className={GRID}>
      <AnimatePresence mode="popLayout">
        {query.data.outgoing.map((r, i) => (
          <PersonCard
            key={r.id}
            index={i}
            user={r.user}
            meta={`Sent ${timeAgo(r.createdAt)}`}
            actions={
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => cancel.mutate({ requestId: r.id, userId: r.user.id, incoming: false })}
                className="h-8 rounded-full bg-white/5 px-4 text-xs text-white/60 transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                Cancel request
              </motion.button>
            }
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function DiscoverTab() {
  const [query, setQuery] = useState("");
  const q = useDebounce(query.trim(), 300);
  const search = useUserSearch(q);

  return (
    <>
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search by name or username"
        loading={search.isFetching}
      />
      <p className="mb-4 text-xs font-medium tracking-wider text-white/40 uppercase">
        {q ? "Results" : "People you may know"}
      </p>

      {search.isPending ? (
        <CardsSkeleton />
      ) : search.isError ? (
        <ErrorState onRetry={() => search.refetch()} />
      ) : search.data.length === 0 ? (
        <EmptyState size="lg" icon={HiOutlineUsers} title={q ? "No one found" : "No suggestions right now"} text={q ? "Try a different name or username." : "Search for someone by name."} />
      ) : (
        <div className={GRID}>
          {search.data.map((u, i) => (
            <PersonCard key={u.id} index={i} user={u} actions={<RelationButton user={u} />} />
          ))}
        </div>
      )}
    </>
  );
}
