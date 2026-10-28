import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { HiOutlineMusicalNote, HiOutlineTrash, HiOutlineUsers, HiPlay, HiXMark } from "react-icons/hi2";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { cn } from "../../../lib/utils";
import TrackCover from "../../music/components/TrackCover";
import { useDeleteRoom, useRemoveMembership } from "../hooks";
import type { RoomCard as Room } from "../types";
import AvatarStack from "./AvatarStack";
import LiveBadge from "./LiveBadge";

const GRADIENTS = [
  "from-violet-600/50 via-fuchsia-600/30 to-transparent",
  "from-sky-600/50 via-indigo-600/30 to-transparent",
  "from-emerald-600/45 via-teal-600/25 to-transparent",
  "from-amber-600/45 via-rose-600/25 to-transparent",
  "from-rose-600/50 via-pink-600/30 to-transparent",
];

export function roomGradient(id: string) {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) % GRADIENTS.length;
  return GRADIENTS[hash];
}

const MotionLink = motion.create(Link);

type Props = { room: Room; owned: boolean; current: boolean; index: number };

export default function RoomCard({ room, owned, current, index }: Props) {
  const [confirm, setConfirm] = useState(false);
  const del = useDeleteRoom();
  const remove = useRemoveMembership();
  const canEnter = owned || room.isLive;

  const label = current ? "Back to room" : owned ? (room.isLive ? "Enter room" : "Start room") : room.isLive ? "Join room" : "Waiting for owner";

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: { delay: Math.min(index, 10) * 0.04 } }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3 }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-white/2 transition-colors",
        room.isLive ? "border-fuchsia-500/25 hover:border-fuchsia-500/40" : "border-white/10 hover:border-white/20",
      )}
    >
      <div className={cn("relative h-28 overflow-hidden bg-linear-to-br", roomGradient(room.id))}>
        {room.nowPlaying?.thumbnailUrl && (
          <img src={room.nowPlaying.thumbnailUrl} alt="" aria-hidden className="absolute inset-0 size-full scale-125 object-cover opacity-40 blur-2xl" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-neutral-950 via-neutral-950/30 to-transparent" />

        <div className="absolute inset-x-3 top-3 flex items-center justify-between">
          <LiveBadge live={room.isLive} />
          <button
            onClick={() => setConfirm(true)}
            aria-label={owned ? "Delete room" : "Remove room"}
            title={owned ? "Delete room" : "Remove from my rooms"}
            className="grid size-8 place-items-center rounded-full bg-black/40 text-white/60 backdrop-blur transition-colors hover:bg-red-500/20 hover:text-red-300 sm:opacity-0 sm:group-hover:opacity-100"
          >
            {owned ? <HiOutlineTrash className="size-4" /> : <HiXMark className="size-4" />}
          </button>
        </div>

        {room.nowPlaying && (
          <div className="absolute inset-x-3 bottom-2 flex items-center gap-2">
            <TrackCover src={room.nowPlaying.thumbnailUrl} className="size-9 rounded-md ring-1 ring-white/10" />
            <div className="min-w-0 text-xs">
              <p className="truncate font-medium">{room.nowPlaying.title}</p>
              <p className="truncate text-white/50">{room.nowPlaying.artist ?? "Unknown artist"}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-3.5 pt-2.5">
        <div className="min-w-0">
          <p className="truncate font-semibold">{room.name}</p>
          <p className="mt-0.5 truncate text-xs text-white/40">
            {owned ? room.description || "Your room" : `by ${room.owner.name}`}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs text-white/50">
          <span className="flex items-center gap-1.5">
            <HiOutlineUsers className="size-4" />
            {room.memberCount} {room.memberCount === 1 ? "member" : "members"}
          </span>
          {room.isLive ? (
            <span className="flex items-center gap-2">
              <AvatarStack users={room.listeners} total={room.listenerCount} max={3} />
              <span className="text-fuchsia-300">{room.listenerCount} listening</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-white/30">
              <HiOutlineMusicalNote className="size-3.5" /> Queue saved
            </span>
          )}
        </div>

        {canEnter ? (
          <MotionLink
            to={`/rooms/${room.id}`}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "mt-auto flex h-10 items-center justify-center gap-1.5 rounded-xl text-sm font-medium transition-[filter]",
              room.isLive || current
                ? "bg-linear-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/20 hover:brightness-110"
                : "bg-white/8 text-white hover:bg-white/12",
            )}
          >
            <HiPlay className="size-4" />
            {label}
          </MotionLink>
        ) : (
          <div className="mt-auto flex h-10 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-white/40">
            {label}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title={owned ? "Delete this room?" : "Remove this room?"}
        description={
          owned
            ? `"${room.name}" and its queue will be deleted for everyone.`
            : `You'll need a new invite from ${room.owner.name} to join "${room.name}" again.`
        }
        confirmLabel={owned ? "Delete" : "Remove"}
        onConfirm={() => (owned ? del.mutate(room.id) : remove.mutate(room.id))}
      />
    </motion.article>
  );
}
