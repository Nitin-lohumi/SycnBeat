import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HiOutlineInbox, HiOutlineMagnifyingGlass, HiOutlineUsers } from "react-icons/hi2";
import EmptyState from "../../../components/common/EmptyState";
import ErrorState from "../../../components/common/ErrorState";
import { UserRowSkeleton } from "../../../components/common/Skeleton";
import { PanelSection } from "../../../components/layout/HeaderPopover";
import { useDebounce } from "../../../hooks/useDebounce";
import { timeAgo } from "../../../lib/time";
import { useFriendRequests, useUserSearch } from "../hooks";
import RelationButton from "./RelationButton";
import RequestActions from "./RequestActions";
import UserRow from "./UserRow";

export const rowMotion = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0, x: 40 },
  transition: { duration: 0.25, ease: "easeOut" },
} as const;

export function RequestsList() {
  const requests = useFriendRequests();
  const incoming = requests.data?.incoming ?? [];

  if (requests.isPending) return <UserRowSkeleton />;
  if (requests.isError) return <ErrorState onRetry={() => requests.refetch()} />;

  return (
    <>
      <AnimatePresence initial={false}>
        {incoming.map((r) => (
          <motion.div key={r.id} {...rowMotion} className="overflow-hidden">
            <UserRow user={r.user} meta={timeAgo(r.createdAt)} actions={<RequestActions request={r} />} />
          </motion.div>
        ))}
      </AnimatePresence>
      {incoming.length === 0 && <EmptyState icon={HiOutlineInbox} title="No pending requests" />}
    </>
  );
}

export function DiscoverList({ searchId }: { searchId?: string }) {
  const [query, setQuery] = useState("");
  const q = useDebounce(query.trim(), 300);
  const search = useUserSearch(q);

  return (
    <>
      <label className="mx-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/3 px-3 transition-colors focus-within:border-violet-500/50 focus-within:bg-white/5">
        <HiOutlineMagnifyingGlass className="size-4 shrink-0 text-white/40" />
        <input
          id={searchId}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or username"
          className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-white/30"
        />
        {search.isFetching && (
          <span className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
        )}
      </label>

      <p className="px-4 pt-4 pb-2 text-xs font-medium tracking-wider text-white/40 uppercase">
        {q ? "Results" : "People you may know"}
      </p>

      {search.isPending ? (
        Array.from({ length: 3 }, (_, i) => <UserRowSkeleton key={i} />)
      ) : search.isError ? (
        <ErrorState onRetry={() => search.refetch()} />
      ) : search.data.length === 0 ? (
        <EmptyState icon={HiOutlineUsers} title={q ? "No one found" : "No suggestions right now"} />
      ) : (
        search.data.map((u) => <UserRow key={u.id} user={u} actions={<RelationButton user={u} />} />)
      )}
    </>
  );
}

// Header popover shows both stacked; the Friends page splits them into tabs.
export default function FriendsFinder() {
  const { data } = useFriendRequests();

  return (
    <>
      <PanelSection title="Requests" count={data?.incoming.length}>
        <RequestsList />
      </PanelSection>
      <div className="mx-4 h-px bg-white/10" />
      <section className="px-2 py-3">
        <DiscoverList />
      </section>
    </>
  );
}
