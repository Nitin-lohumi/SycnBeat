import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import {
  HiOutlineInbox,
  HiOutlineMagnifyingGlass,
  HiOutlinePaperAirplane,
  HiOutlineSparkles,
  HiOutlineUserGroup,
  HiOutlineUsers,
} from "react-icons/hi2";
import EmptyState from "../components/common/EmptyState";
import ErrorState from "../components/common/ErrorState";
import Panel from "../components/common/Panel";
import PillTabs from "../components/common/PillTabs";
import { Skeleton } from "../components/common/Skeleton";
import Spinner from "../components/common/Spinner";
import Page, { GradientText, SPLIT } from "../components/layout/Page";
import FriendCard from "../features/friends/components/FriendCard";
import { DiscoverList, RequestsList } from "../features/friends/components/FriendsFinder";
import PersonCard from "../features/friends/components/PersonCard";
import { useDeleteFriendRequest, useFriendRequests, useFriends } from "../features/friends/hooks";
import { ease } from "../lib/motion";
import { timeAgo } from "../lib/time";
import { cn } from "../lib/utils";

type ListTab = "friends" | "sent";
type FinderTab = "requests" | "discover";

const GRID = "grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-3";
const FINDER_SEARCH_ID = "friends-finder-search";

const fade = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.22, ease },
};

export default function FriendsPage() {
  const [params, setParams] = useSearchParams();
  const tab: ListTab = params.get("tab") === "sent" ? "sent" : "friends";
  const setTab = (id: ListTab) => setParams(id === "friends" ? {} : { tab: id }, { replace: true });
  const [finderTab, setFinderTab] = useState<FinderTab>("discover");

  const friends = useFriends();
  const requests = useFriendRequests();
  const incomingCount = requests.data?.incoming.length;

  const requestsRefetching = requests.isFetching && !requests.isPending;
  const leftLoading = tab === "friends" ? friends.isFetching && !friends.isPending : requestsRefetching;
  // Left and right share the requests query; show its bar in one place only.
  const rightLoading = finderTab === "requests" && requestsRefetching && tab !== "sent";

  const findPeople = () => {
    setFinderTab("discover");
    setTimeout(() => {
      const input = document.getElementById(FINDER_SEARCH_ID);
      input?.scrollIntoView({ behavior: "smooth", block: "center" });
      input?.focus({ preventScroll: true });
    }, 50);
  };

  return (
    <Page
      fixed
      title={<>Your <GradientText>people</GradientText></>}
      subtitle="Add friends, then pull them into a room and listen together."
    >
      <div className={cn(SPLIT, "lg:h-full")}>
        <Panel
          delay={0.1}
          className="lg:col-span-3"
          loading={leftLoading}
          header={
            <PillTabs
              layoutId="friends-list-tab"
              value={tab}
              onChange={setTab}
              tabs={[
                { id: "friends", label: "Friends", icon: HiOutlineUserGroup, count: friends.data?.length },
                { id: "sent", label: "Sent", icon: HiOutlinePaperAirplane, count: requests.data?.outgoing.length },
              ]}
            />
          }
        >
          <AnimatePresence mode="wait">
            <motion.div key={tab} {...fade} className="p-3 sm:p-4">
              {tab === "friends" ? (
                <FriendsTab query={friends} onFindPeople={findPeople} />
              ) : (
                <SentTab query={requests} onFindPeople={findPeople} />
              )}
            </motion.div>
          </AnimatePresence>
        </Panel>

        <Panel
          delay={0.15}
          className="order-first max-h-120 lg:order-last lg:col-span-2 lg:max-h-none"
          loading={rightLoading}
          header={
            <PillTabs
              layoutId="friends-finder-tab"
              value={finderTab}
              onChange={setFinderTab}
              tabs={[
                { id: "requests", label: "Requests", icon: HiOutlineInbox, count: incomingCount, highlight: true },
                { id: "discover", label: "Discover", icon: HiOutlineSparkles },
              ]}
            />
          }
        >
          <motion.div key={finderTab} initial={fade.initial} animate={fade.animate} transition={fade.transition} className="p-2">
            {finderTab === "requests" ? <RequestsList /> : <DiscoverList searchId={FINDER_SEARCH_ID} />}
          </motion.div>
        </Panel>
      </div>
    </Page>
  );
}

function SearchInput({ value, onChange, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="mb-3 flex w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/3 px-3 transition-colors focus-within:border-violet-500/50 focus-within:bg-white/5">
      <HiOutlineMagnifyingGlass className="size-4 shrink-0 text-white/40" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-white/30"
      />
    </label>
  );
}

function CardsSkeleton() {
  return (
    <div className={GRID}>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex flex-col items-center overflow-hidden rounded-2xl border border-white/10 bg-white/3 pb-2">
          <div className="h-12 w-full bg-white/3" />
          <Skeleton className="-mt-7 size-14 rounded-full" />
          <Skeleton className="mt-2.5 h-3 w-20" />
          <Skeleton className="mt-1.5 h-2.5 w-14" />
          <div className="mt-3 flex w-full gap-2 px-2">
            <Skeleton className="h-8 flex-1 rounded-full" />
            <Skeleton className="h-8 flex-1 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

const FindPeopleButton = ({ onClick }: { onClick: () => void }) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white/90"
  >
    <HiOutlineSparkles className="size-4" /> Find people
  </motion.button>
);

function FriendsTab({ query, onFindPeople }: { query: ReturnType<typeof useFriends>; onFindPeople: () => void }) {
  const [filter, setFilter] = useState("");

  if (query.isPending) return <CardsSkeleton />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;
  if (query.data.length === 0) {
    return (
      <EmptyState
        size="lg"
        icon={HiOutlineUserGroup}
        title="No friends yet"
        text="Find people you know and send them a request."
        action={<FindPeopleButton onClick={onFindPeople} />}
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
          <AnimatePresence initial={false}>
            {visible.map((fr, i) => (
              <FriendCard key={fr.user.id} friend={fr} index={i} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}

function CancelRequestButton({ requestId }: { requestId: string }) {
  const cancel = useDeleteFriendRequest();
  return (
    <motion.button
      whileTap={cancel.isPending ? undefined : { scale: 0.95 }}
      disabled={cancel.isPending}
      onClick={() => cancel.mutate(requestId)}
      className="flex h-8 w-full items-center justify-center rounded-full bg-white/5 px-3 text-xs text-white/60 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-60"
    >
      {cancel.isPending ? <Spinner className="size-3.5" /> : "Cancel"}
    </motion.button>
  );
}

function SentTab({ query, onFindPeople }: { query: ReturnType<typeof useFriendRequests>; onFindPeople: () => void }) {
  if (query.isPending) return <CardsSkeleton />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;
  if (query.data.outgoing.length === 0) {
    return (
      <EmptyState
        size="lg"
        icon={HiOutlinePaperAirplane}
        title="No sent requests"
        text="Requests you send will wait here until they're accepted."
        action={<FindPeopleButton onClick={onFindPeople} />}
      />
    );
  }

  return (
    <div className={GRID}>
      <AnimatePresence initial={false}>
        {query.data.outgoing.map((r, i) => (
          <PersonCard
            compact
            key={r.id}
            index={i}
            user={r.user}
            meta={`Sent ${timeAgo(r.createdAt)}`}
            footer={<CancelRequestButton requestId={r.id} />}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
