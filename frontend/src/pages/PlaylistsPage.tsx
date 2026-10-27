import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { HiPlus } from "react-icons/hi2";
import ErrorState from "../components/common/ErrorState";
import { Skeleton } from "../components/common/Skeleton";
import Page, { GradientText } from "../components/layout/Page";
import CreatePlaylistButton from "../features/music/components/CreatePlaylistButton";
import PlaylistCard from "../features/music/components/PlaylistCard";
import { useLibrary } from "../features/music/hooks";

const GRID = "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6";

export default function PlaylistsPage() {
  const library = useLibrary();

  return (
    <Page
      title={<>Your <GradientText>playlists</GradientText></>}
      subtitle="Everything you've saved, in one place."
      actions={<CreatePlaylistButton />}
    >
      {library.isPending ? (
        <div className={GRID}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="rounded-2xl border border-white/5 p-3">
              <Skeleton className="aspect-square w-full rounded-2xl" />
              <Skeleton className="mt-3 h-3.5 w-3/4" />
              <Skeleton className="mt-2 h-2.5 w-1/3" />
            </div>
          ))}
        </div>
      ) : library.isError ? (
        <ErrorState onRetry={() => library.refetch()} />
      ) : (
        <div className={GRID}>
          <PlaylistCard
            liked
            index={0}
            to="/playlists/liked"
            name="Liked Songs"
            trackCount={library.data.liked.trackCount}
            covers={library.data.liked.covers}
          />
          <AnimatePresence initial={false}>
            {library.data.playlists.map((p, i) => (
              <PlaylistCard
                key={p.id}
                index={i + 1}
                playlistId={p.id}
                to={`/playlists/${p.id}`}
                name={p.name}
                trackCount={p.trackCount}
                covers={p.covers}
              />
            ))}
          </AnimatePresence>
          <motion.div
            layout="position"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(library.data.playlists.length + 1, 12) * 0.04 }}
          >
            <Link
              to="/playlists/new"
              className="group flex h-full min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 p-3 text-white/50 transition-colors hover:border-violet-400/50 hover:bg-violet-500/5 hover:text-white"
            >
              <span className="grid size-14 place-items-center rounded-full bg-white/5 transition-transform duration-300 group-hover:scale-110 group-hover:bg-violet-500/20">
                <HiPlus className="size-6" />
              </span>
              <span className="text-sm font-medium">New playlist</span>
            </Link>
          </motion.div>
        </div>
      )}
    </Page>
  );
}
