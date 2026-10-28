import { useEffect, useState, type ReactNode } from "react";
import { HiMagnifyingGlass, HiOutlineMusicalNote, HiXMark } from "react-icons/hi2";
import EmptyState from "../../../components/common/EmptyState";
import ErrorState from "../../../components/common/ErrorState";
import Spinner from "../../../components/common/Spinner";
import { useDebounce } from "../../../hooks/useDebounce";
import { useInView } from "../../../hooks/useInView";
import { useTrackSearch } from "../hooks";
import type { Track } from "../types";
import TrackList from "./TrackList";

type Props = {
  trailing?: (track: Track, index: number) => ReactNode;
  autoFocus?: boolean;
  playable?: boolean;
};

export default function SongSearch({ trailing, autoFocus, playable }: Props) {
  const [query, setQuery] = useState("");
  const q = useDebounce(query.trim(), 350);
  const search = useTrackSearch(q);
  const [sentinel, inView] = useInView<HTMLDivElement>();

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = search;
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 bg-neutral-950/85 p-3 backdrop-blur-xl sm:px-4">
        <label className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/4 px-3 transition-colors focus-within:border-violet-500/50 focus-within:bg-white/6">
          <HiMagnifyingGlass className="size-4.5 shrink-0 text-white/40" />
          <input
            value={query}
            autoFocus={autoFocus}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs, artists…"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-white/30"
          />
          {search.isFetching && !isFetchingNextPage ? (
            <Spinner className="size-4 shrink-0" />
          ) : (
            query && (
              <button onClick={() => setQuery("")} aria-label="Clear search" className="text-white/40 hover:text-white">
                <HiXMark className="size-4.5" />
              </button>
            )
          )}
        </label>
        <p className="mt-3 px-1 text-xs font-medium tracking-wider text-white/40 uppercase">
          {q ? `Results for "${q}"` : "Trending this week"}
        </p>
      </div>

      <div className="px-1.5 pb-3 sm:px-2.5">
        {search.isError && !search.data ? (
          <ErrorState onRetry={() => search.refetch()} />
        ) : (
          <TrackList
            tracks={search.tracks}
            loading={search.isPending}
            trailing={trailing}
            playable={playable}
            empty={
              <EmptyState icon={HiOutlineMusicalNote} title="No songs found" text="Try another song or artist name." />
            }
          />
        )}
        <div ref={sentinel} className="flex h-12 items-center justify-center">
          {isFetchingNextPage && <Spinner className="size-5" />}
        </div>
      </div>
    </div>
  );
}
