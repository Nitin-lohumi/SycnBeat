import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { HiCheck, HiOutlineQueueList, HiPlus } from "react-icons/hi2";
import { toast } from "sonner";
import EmptyState from "../../../components/common/EmptyState";
import ErrorState from "../../../components/common/ErrorState";
import Modal from "../../../components/common/Modal";
import { UserRowSkeleton } from "../../../components/common/Skeleton";
import Spinner from "../../../components/common/Spinner";
import { cn } from "../../../lib/utils";
import { useAddToPlaylistDialog } from "../../../store/addToPlaylist";
import { useAddToPlaylist, useCreatePlaylist, useLibrary, useMembership } from "../hooks";
import type { PlaylistSummary, Track } from "../types";
import { songCount, toRef } from "../utils";
import PlaylistCover from "./PlaylistCover";
import TrackCover from "./TrackCover";

export default function AddToPlaylistDialog() {
  const track = useAddToPlaylistDialog((s) => s.track);
  const close = useAddToPlaylistDialog((s) => s.close);

  return (
    <Modal open={!!track} title="Add to playlist" onClose={close}>
      {track && <DialogBody track={track} />}
    </Modal>
  );
}

function DialogBody({ track }: { track: Track }) {
  const library = useLibrary();
  const membership = useMembership(track);
  const added = new Set(membership.data ?? []);

  return (
    <>
      <div className="flex items-center gap-3 border-b border-white/5 px-5 py-3">
        <TrackCover src={track.thumbnailUrl} className="size-10 rounded-lg" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{track.title}</p>
          <p className="truncate text-xs text-white/40">{track.artist ?? "Unknown artist"}</p>
        </div>
      </div>

      <QuickCreate track={track} />

      <div className="p-2">
        {library.isPending || membership.isPending ? (
          Array.from({ length: 3 }, (_, i) => <UserRowSkeleton key={i} />)
        ) : library.isError ? (
          <ErrorState onRetry={() => library.refetch()} />
        ) : library.data.playlists.length === 0 ? (
          <EmptyState icon={HiOutlineQueueList} title="No playlists yet" text="Create your first one above." />
        ) : (
          library.data.playlists.map((p) => (
            <PlaylistOption key={p.id} playlist={p} track={track} added={added.has(p.id)} />
          ))
        )}
      </div>
    </>
  );
}

function PlaylistOption({ playlist, track, added }: { playlist: PlaylistSummary; track: Track; added: boolean }) {
  const add = useAddToPlaylist();

  return (
    <button
      disabled={added || add.isPending}
      onClick={() =>
        add.mutate(
          { playlistId: playlist.id, track: toRef(track) },
          { onSuccess: () => toast.success(`Added to ${playlist.name}`) },
        )
      }
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors enabled:hover:bg-white/5 disabled:cursor-default"
    >
      <PlaylistCover covers={playlist.covers} className="size-11 rounded-lg" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{playlist.name}</p>
        <p className="text-xs text-white/40">{songCount(playlist.trackCount)}</p>
      </div>
      <span
        className={cn(
          "flex h-8 min-w-20 items-center justify-center gap-1 rounded-full px-3 text-xs font-medium",
          added ? "bg-emerald-500/15 text-emerald-300" : "bg-white/8 text-white/80",
        )}
      >
        {add.isPending ? <Spinner className="size-3.5" /> : added ? <><HiCheck className="size-3.5" /> Added</> : <><HiPlus className="size-3.5" /> Add</>}
      </span>
    </button>
  );
}

function QuickCreate({ track }: { track: Track }) {
  const [name, setName] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const create = useCreatePlaylist();
  const trimmed = name.trim();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!trimmed) {
          setError(true);
          inputRef.current?.focus();
          return;
        }
        create.mutate(
          { name: trimmed, tracks: [toRef(track)] },
          {
            onSuccess: (p) => {
              toast.success(`Created ${p.name}`);
              setName("");
            },
          },
        );
      }}
      className="px-4 pt-3"
    >
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (e.target.value.trim()) setError(false);
          }}
          maxLength={60}
          placeholder="New playlist name"
          aria-invalid={error}
          className={cn(
            "h-10 min-w-0 flex-1 rounded-xl border bg-white/4 px-3 text-sm outline-none placeholder:text-white/30",
            error ? "border-red-500/60" : "border-white/10 focus:border-violet-500/50",
          )}
        />
        <motion.button
          whileTap={{ scale: 0.95 }}
          disabled={create.isPending}
          className="flex h-10 min-w-24 items-center justify-center gap-1.5 rounded-xl bg-linear-to-r from-violet-500 to-fuchsia-500 px-4 text-sm font-medium text-white shadow-lg shadow-fuchsia-500/20 transition-[filter] hover:brightness-110 disabled:opacity-60"
        >
          {create.isPending ? <Spinner className="size-4" /> : <><HiPlus className="size-4" /> Create</>}
        </motion.button>
      </div>
      {error && <p className="mt-1.5 px-1 text-xs text-red-400">Type a name first</p>}
    </form>
  );
}
