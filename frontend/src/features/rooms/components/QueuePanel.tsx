import { useEffect, useState } from "react";
import { AnimatePresence, Reorder, useDragControls } from "framer-motion";
import { HiBars2, HiOutlineQueueList, HiPlus } from "react-icons/hi2";
import EmptyState from "../../../components/common/EmptyState";
import ErrorState from "../../../components/common/ErrorState";
import UserAvatar from "../../../components/UserAvatar";
import { useRoom, useRoomPermissions } from "../../../store/room";
import { RemoveTrackButton } from "../../music/components/TrackActions";
import TrackRow, { TrackRowSkeleton } from "../../music/components/TrackRow";
import { songCount, toRef, totalDuration, trackKey } from "../../music/utils";
import { useRemoveFromQueue, useReorderQueue, useRoomQueue } from "../hooks";
import type { QueueTrack } from "../types";

export function QueueHeader({ onAdd }: { onAdd: () => void }) {
  const roomId = useRoom((s) => s.roomId);
  const queue = useRoomQueue(roomId);
  const { canQueue } = useRoomPermissions();
  const tracks = queue.data ?? [];

  return (
    <>
      <div className="min-w-0">
        <p className="font-semibold">Queue</p>
        <p className="truncate text-[11px] text-white/40">
          {songCount(tracks.length)}
          {tracks.length > 0 && ` · ${totalDuration(tracks)}`}
        </p>
      </div>
      <button
        onClick={onAdd}
        className="ml-auto flex h-8 items-center gap-1 rounded-full bg-white/8 px-3 text-xs font-medium transition-colors hover:bg-white/15"
      >
        <HiPlus className="size-3.5" /> {canQueue ? "Add" : "Request"}
      </button>
    </>
  );
}

export default function QueuePanel({ onAdd }: { onAdd: () => void }) {
  const roomId = useRoom((s) => s.roomId);
  const control = useRoom((s) => s.control);
  const queue = useRoomQueue(roomId);
  const { canQueue, canControl } = useRoomPermissions();
  const remove = useRemoveFromQueue();
  const reorder = useReorderQueue();
  const [items, setItems] = useState<QueueTrack[]>([]);

  useEffect(() => {
    if (queue.data) setItems(queue.data);
  }, [queue.data]);

  if (!roomId) return null;
  if (queue.isPending) return <div className="p-2">{Array.from({ length: 6 }, (_, i) => <TrackRowSkeleton key={i} />)}</div>;
  if (queue.isError) return <ErrorState onRetry={() => queue.refetch()} />;
  if (items.length === 0) {
    return (
      <EmptyState
        icon={HiOutlineQueueList}
        title="Nothing queued"
        text={canQueue ? "Add songs or a playlist for everyone." : "Request a song and the admin can add it."}
        action={
          <button onClick={onAdd} className="rounded-full bg-white/8 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/12">
            {canQueue ? "Add songs" : "Request a song"}
          </button>
        }
      />
    );
  }

  const commitOrder = () => {
    const changed = items.some((t, i) => trackKey(t) !== trackKey(queue.data![i]));
    if (changed) reorder.mutate({ id: roomId, tracks: items.map(toRef) });
  };

  return (
    <div className="px-1.5 py-2 sm:px-2">
      <Reorder.Group axis="y" values={items} onReorder={setItems}>
        <AnimatePresence initial={false}>
          {items.map((track, i) => (
            <QueueItem
              key={trackKey(track)}
              track={track}
              index={i}
              draggable={canQueue}
              onDrop={commitOrder}
              onPlay={canControl ? () => control({ action: "track", track: toRef(track) }) : undefined}
              onRemove={canQueue ? () => remove.mutate({ id: roomId, track: toRef(track) }) : undefined}
            />
          ))}
        </AnimatePresence>
      </Reorder.Group>
    </div>
  );
}

type ItemProps = {
  track: QueueTrack;
  index: number;
  draggable: boolean;
  onDrop: () => void;
  onPlay?: () => void;
  onRemove?: () => void;
};

function QueueItem({ track, index, draggable, onDrop, onPlay, onRemove }: ItemProps) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={track}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDrop}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0, x: 24 }}
      whileDrag={{ scale: 1.02, boxShadow: "0 12px 30px rgba(0,0,0,0.5)" }}
      className="relative rounded-xl bg-neutral-950"
    >
      <TrackRow
        track={track}
        index={index}
        showIndex={!draggable}
        onPlay={onPlay}
        leading={
          draggable && (
            <button
              onPointerDown={(e) => controls.start(e)}
              aria-label="Drag to reorder"
              className="grid size-7 shrink-0 cursor-grab touch-none place-items-center rounded-md text-white/30 hover:text-white active:cursor-grabbing"
            >
              <HiBars2 className="size-4.5" />
            </button>
          )
        }
        trailing={
          <>
            {track.addedBy && (
              <span title={`Added by ${track.addedBy.name}`}>
                <UserAvatar user={track.addedBy} className="size-5 text-[9px]" />
              </span>
            )}
            {onRemove && <RemoveTrackButton onRemove={onRemove} label="Remove from queue" />}
          </>
        }
      />
    </Reorder.Item>
  );
}
