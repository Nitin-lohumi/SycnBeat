import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import { HiOutlineHeart, HiOutlineMusicalNote, HiOutlinePencilSquare, HiOutlineTrash, HiPlay } from "react-icons/hi2";
import ConfirmDialog from "../components/common/ConfirmDialog";
import EmptyState from "../components/common/EmptyState";
import ErrorState from "../components/common/ErrorState";
import Panel from "../components/common/Panel";
import Page, { SPLIT } from "../components/layout/Page";
import NowPlayingPanel from "../features/music/components/NowPlaying";
import PlaylistCover from "../features/music/components/PlaylistCover";
import { AddToPlaylistButton, RemoveTrackButton } from "../features/music/components/TrackActions";
import LikeButton from "../features/music/components/LikeButton";
import TrackList from "../features/music/components/TrackList";
import { useDeletePlaylist, useLikedTracks, usePlaylist, useRemoveFromPlaylist } from "../features/music/hooks";
import type { Track } from "../features/music/types";
import { songCount, toRef, totalDuration } from "../features/music/utils";
import { isNotFound } from "../lib/errors";
import { cn } from "../lib/utils";
import { usePlayer } from "../store/player";

type ViewProps = {
  name: string;
  description?: string | null;
  tracks: Track[] | undefined;
  loading: boolean;
  fetching: boolean;
  liked?: boolean;
  actions?: ReactNode;
  trailing: (track: Track) => ReactNode;
  empty: ReactNode;
};

function PlaylistView({ name, description, tracks, loading, fetching, liked, actions, trailing, empty }: ViewProps) {
  const playQueue = usePlayer((s) => s.playQueue);
  const list = tracks ?? [];
  const covers = list.flatMap((t) => (t.thumbnailUrl ? [t.thumbnailUrl] : [])).slice(0, 4);
  const meta = loading ? "Loading…" : `${songCount(list.length)}${list.length ? ` · ${totalDuration(list)}` : ""}`;

  return (
    <Page
      fixed
      back="/playlists"
      leading={<PlaylistCover covers={covers} liked={liked} className="size-16 rounded-xl shadow-lg shadow-black/40 sm:size-20" />}
      title={name}
      subtitle={description ? `${description} · ${meta}` : meta}
      actions={
        <>
          {actions}
          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={list.length === 0}
            onClick={() => playQueue(list, 0)}
            className="flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-sm font-medium text-black shadow-lg shadow-fuchsia-500/20 transition-opacity disabled:opacity-40"
          >
            <HiPlay className="size-4" /> Play
          </motion.button>
        </>
      }
    >
      <div className={cn(SPLIT, "lg:h-full")}>
        <Panel
          delay={0.1}
          loading={fetching && !loading}
          className="lg:col-span-3"
          header={<p className="font-semibold">Songs</p>}
        >
          <div className="p-1.5 sm:p-2.5">
            <TrackList tracks={list} loading={loading} showIndex trailing={trailing} empty={empty} />
          </div>
        </Panel>
        <NowPlayingPanel />
      </div>
    </Page>
  );
}

export function LikedSongsPage() {
  const liked = useLikedTracks();

  if (liked.isError) return <PageError onRetry={() => liked.refetch()} />;

  return (
    <PlaylistView
      liked
      name="Liked Songs"
      tracks={liked.data}
      loading={liked.isPending}
      fetching={liked.isFetching}
      trailing={(track) => <LikeButton track={track} />}
      empty={
        <EmptyState
          size="lg"
          icon={HiOutlineHeart}
          title="No liked songs yet"
          text="Tap the heart on any song and it lands here."
          action={<BrowseLink />}
        />
      }
    />
  );
}

export default function PlaylistPage() {
  const { id = "" } = useParams();
  const playlist = usePlaylist(id);
  const remove = useRemoveFromPlaylist();
  const del = useDeletePlaylist();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);

  if (playlist.isError) {
    return isNotFound(playlist.error) ? <PageNotFound /> : <PageError onRetry={() => playlist.refetch()} />;
  }

  const iconLink = "grid size-10 place-items-center rounded-full bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white";

  return (
    <>
      <PlaylistView
        name={playlist.data?.name ?? "Playlist"}
        description={playlist.data?.description}
        tracks={playlist.data?.tracks}
        loading={playlist.isPending}
        fetching={playlist.isFetching}
        actions={
          <>
            <Link to={`/playlists/${id}/edit`} aria-label="Edit playlist" title="Edit" className={iconLink}>
              <HiOutlinePencilSquare className="size-5" />
            </Link>
            <button
              onClick={() => setConfirming(true)}
              aria-label="Delete playlist"
              title="Delete"
              className={cn(iconLink, "hover:bg-red-500/10 hover:text-red-400")}
            >
              <HiOutlineTrash className="size-5" />
            </button>
          </>
        }
        trailing={(track) => (
          <>
            <LikeButton track={track} />
            <AddToPlaylistButton track={track} className="hidden sm:grid" />
            <RemoveTrackButton
              label="Remove from playlist"
              onRemove={() => remove.mutate({ playlistId: id, track: toRef(track) })}
            />
          </>
        )}
        empty={
          <EmptyState
            size="lg"
            icon={HiOutlineMusicalNote}
            title="This playlist is empty"
            text="Add a few songs to get it going."
            action={
              <Link to={`/playlists/${id}/edit`} className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black">
                Add songs
              </Link>
            }
          />
        }
      />

      <ConfirmDialog
        open={confirming}
        title={`Delete "${playlist.data?.name}"?`}
        description="The playlist will be gone for good. Songs stay in your Liked Songs."
        confirmLabel="Delete"
        onConfirm={() => {
          // Leave first so the refetch after delete doesn't flash "not found" here.
          navigate("/playlists", { replace: true });
          del.mutate(id);
        }}
        onClose={() => setConfirming(false)}
      />
    </>
  );
}

function BrowseLink() {
  return (
    <Link to="/songs" className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black">
      Browse songs
    </Link>
  );
}

function PageNotFound() {
  return (
    <div className="py-20">
      <EmptyState
        size="lg"
        icon={HiOutlineMusicalNote}
        title="Playlist not found"
        text="It may have been deleted."
        action={<Link to="/playlists" className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black">Back to playlists</Link>}
      />
    </div>
  );
}

function PageError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="py-20">
      <ErrorState onRetry={onRetry} />
    </div>
  );
}
