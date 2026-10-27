import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { HiOutlineInbox, HiOutlineMagnifyingGlass, HiOutlineUserPlus, HiOutlineUsers } from "react-icons/hi2";
import EmptyState from "../../../components/common/EmptyState";
import ErrorState from "../../../components/common/ErrorState";
import { UserRowSkeleton } from "../../../components/common/Skeleton";
import HeaderPopover, { PanelHeader, PanelSection } from "../../../components/layout/HeaderPopover";
import { useDebounce } from "../../../hooks/useDebounce";
import { timeAgo } from "../../../lib/time";
import { useCounts } from "../../notifications/hooks";
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

export default function FriendRequestsMenu() {
  const { data: counts } = useCounts();

  return (
    <HeaderPopover label="Friends" icon={HiOutlineUserPlus} badge={counts?.friendRequests ?? 0}>
      {(close) => <FriendsPanel onNavigate={close} />}
    </HeaderPopover>
  );
}

function FriendsPanel({ onNavigate }: { onNavigate: () => void }) {
  const requests = useFriendRequests();
  const [query, setQuery] = useState("");
  const q = useDebounce(query.trim(), 300);
  const search = useUserSearch(q);

  const incoming = requests.data?.incoming ?? [];

  return (
    <>
      <PanelHeader
        title="Friends"
        loading={requests.isFetching && !requests.isPending}
        action={
          <Link
            to="/friends"
            onClick={onNavigate}
            className="text-xs text-violet-300 transition-colors hover:text-violet-200"
          >
            See all
          </Link>
        }
      />

      <div className="overflow-y-auto">
        <PanelSection title="Requests" count={incoming.length}>
          {requests.isPending ? (
            <UserRowSkeleton />
          ) : requests.isError ? (
            <ErrorState onRetry={() => requests.refetch()} />
          ) : (
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
          )}
        </PanelSection>

        <div className="mx-4 h-px bg-white/10" />

        <PanelSection title={q ? "Results" : "People you may know"}>
          <label className="mx-2 mb-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/3 px-3 transition-colors focus-within:border-violet-500/50 focus-within:bg-white/5">
            <HiOutlineMagnifyingGlass className="size-4 shrink-0 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or username"
              className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-white/30"
            />
            {search.isFetching && (
              <span className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
            )}
          </label>

          {search.isPending ? (
            Array.from({ length: 3 }, (_, i) => <UserRowSkeleton key={i} />)
          ) : search.isError ? (
            <ErrorState onRetry={() => search.refetch()} />
          ) : search.data.length === 0 ? (
            <EmptyState icon={HiOutlineUsers} title={q ? "No one found" : "No suggestions right now"} />
          ) : (
            search.data.map((u) => <UserRow key={u.id} user={u} actions={<RelationButton user={u} />} />)
          )}
        </PanelSection>
      </div>
    </>
  );
}
