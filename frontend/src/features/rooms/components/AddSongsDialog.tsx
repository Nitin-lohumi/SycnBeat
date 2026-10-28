import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { HiCheck, HiOutlineHandRaised, HiOutlineMagnifyingGlass, HiOutlineQueueList, HiPlus } from "react-icons/hi2";
import EmptyState from "../../../components/common/EmptyState";
import ErrorState from "../../../components/common/ErrorState";
import Modal from "../../../components/common/Modal";
import PillTabs from "../../../components/common/PillTabs";
import { UserRowSkeleton } from "../../../components/common/Skeleton";
import Spinner from "../../../components/common/Spinner";
import { cn } from "../../../lib/utils";
import { useRoom, useRoomPermissions } from "../../../store/room";
import PlaylistCover from "../../music/components/PlaylistCover";
import SongSearch from "../../music/components/SongSearch";
import { useLibrary } from "../../music/hooks";
import type { Track } from "../../music/types";
import { songCount, toRef, trackKey } from "../../music/utils";
import { useAddToQueue, useRoomQueue } from "../hooks";

type Tab = "search" | "playlists";

export default function AddSongsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { canQueue } = useRoomPermissions();
  const [tab, setTab] = useState<Tab>("search");

  return (
    <Modal open={open} title={canQueue ? "Add to queue" : "Request a song"} onClose={onClose}>
      {canQueue && (
        <div className="border-b border-white/5 px-4 py-2.5">
          <PillTabs
            layoutId="add-songs-tab"
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "search", label: "Search", icon: HiOutlineMagnifyingGlass },
              { id: "playlists", label: "My playlists", icon: HiOutlineQueueList },
            ]}
          />
        </div>
      )}
      {canQueue && tab === "playlists" ? <PlaylistPicker /> : <SearchTab canQueue={canQueue} />}
    </Modal>
  );
}

function SearchTab({ canQueue }: { canQueue: boolean }) {
  const roomId = useRoom((s) => s.roomId)!;
  const queue = useRoomQueue(roomId);
  const queued = useMemo(() => new Set(queue.data?.map(trackKey)), [queue.data]);

  return (
    <SongSearch
      autoFocus
      playable={false}
      trailing={(track) =>
        canQueue ? <QueueButton roomId={roomId} track={track} queued={queued.has(trackKey(track))} /> : <RequestButton track={track} queued={queued.has(trackKey(track))} />
      }
    />
  );
}

const pill = "flex h-8 min-w-20 items-center justify-center gap-1 rounded-full px-3 text-xs font-medium transition-colors";

function QueueButton({ roomId, track, queued }: { roomId: string; track: Track; queued: boolean }) {
  const add = useAddToQueue();
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      disabled={queued || add.isPending}
      onClick={() => add.mutate({ id: roomId, tracks: [toRef(track)] })}
      className={cn(pill, queued ? "bg-emerald-500/15 text-emerald-300" : "bg-white/8 text-white/80 hover:bg-white/15 hover:text-white")}
    >
      {add.isPending ? <Spinner className="size-3.5" /> : queued ? <><HiCheck className="size-3.5" /> Queued</> : <><HiPlus className="size-3.5" /> Add</>}
    </motion.button>
  );
}

function RequestButton({ track, queued }: { track: Track; queued: boolean }) {
  const requestSong = useRoom((s) => s.requestSong);
  const [state, setState] = useState<"idle" | "busy" | "sent">("idle");

  if (queued) return <span className={cn(pill, "bg-emerald-500/15 text-emerald-300")}><HiCheck className="size-3.5" /> Queued</span>;
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      disabled={state !== "idle"}
      onClick={async () => {
        setState("busy");
        setState((await requestSong(toRef(track))) ? "sent" : "idle");
      }}
      className={cn(pill, state === "sent" ? "bg-violet-500/15 text-violet-300" : "bg-white/8 text-white/80 hover:bg-white/15 hover:text-white")}
    >
      {state === "busy" ? <Spinner className="size-3.5" /> : state === "sent" ? <><HiCheck className="size-3.5" /> Asked</> : <><HiOutlineHandRaised className="size-3.5" /> Request</>}
    </motion.button>
  );
}

function PlaylistPicker() {
  const roomId = useRoom((s) => s.roomId)!;
  const library = useLibrary();
  const add = useAddToQueue();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (library.isPending) return <div className="p-2">{Array.from({ length: 3 }, (_, i) => <UserRowSkeleton key={i} />)}</div>;
  if (library.isError) return <ErrorState onRetry={() => library.refetch()} />;
  const playlists = library.data.playlists.filter((p) => p.trackCount > 0);
  if (playlists.length === 0) {
    return <EmptyState icon={HiOutlineQueueList} title="No playlists with songs" text="Make a playlist first, then drop it in here in one tap." />;
  }

  return (
    <div className="p-2">
      {playlists.map((p) => (
        <div key={p.id} className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-white/4">
          <PlaylistCover covers={p.covers} className="size-11 rounded-lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{p.name}</p>
            <p className="text-xs text-white/40">{songCount(p.trackCount)}</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            disabled={add.isPending}
            onClick={() => {
              setBusyId(p.id);
              add.mutate({ id: roomId, playlistId: p.id }, { onSettled: () => setBusyId(null) });
            }}
            className={cn(pill, "bg-white/8 text-white/80 hover:bg-white/15 hover:text-white")}
          >
            {busyId === p.id ? <Spinner className="size-3.5" /> : <><HiPlus className="size-3.5" /> Add all</>}
          </motion.button>
        </div>
      ))}
    </div>
  );
}
