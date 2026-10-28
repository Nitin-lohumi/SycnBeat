import { useState } from "react";
import { motion } from "framer-motion";
import { HiCheck, HiXMark } from "react-icons/hi2";
import Spinner from "../../../components/common/Spinner";
import UserAvatar from "../../../components/UserAvatar";
import { cn } from "../../../lib/utils";
import { useRoom, useRoomPermissions } from "../../../store/room";
import TrackCover from "../../music/components/TrackCover";
import type { RequestMessage } from "../types";

const ABILITY_LABEL = { canQueue: "add songs", canControl: "control playback" } as const;

const STATUS = {
  approved: { text: "✓ Approved", className: "text-emerald-300" },
  declined: { text: "Declined", className: "text-white/30" },
  expired: { text: "Song already changed", className: "text-white/30" },
  pending: { text: "Waiting for approval…", className: "text-violet-300" },
} as const;

const SHORT_STATUS = { approved: "Approved", declined: "Declined", expired: "Song changed", pending: "Pending" } as const;

function useRequest(msg: RequestMessage) {
  const resolve = useRoom((s) => s.resolveRequest);
  const { owner, admin, canControl } = useRoomPermissions();
  const [busy, setBusy] = useState<"yes" | "no" | null>(null);
  const req = msg.request;
  // Songs: admin. Skips: anyone with control. Abilities: owner.
  const allowed = req.type === "song" ? admin : req.type === "skip" ? canControl : owner;

  const act = async (approve: boolean) => {
    setBusy(approve ? "yes" : "no");
    await resolve(msg.id, approve);
    setBusy(null);
  };
  return { req, busy, act, canResolve: msg.status === "pending" && allowed };
}

// One-line version for the chat, so requests don't eat the conversation.
export function RequestLine({ msg }: { msg: RequestMessage }) {
  const { req, busy, act, canResolve } = useRequest(msg);
  const verb = req.type === "song" ? "wants to play" : req.type === "skip" ? "wants to skip" : `asks to ${ABILITY_LABEL[req.ability]}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 ring-1",
        msg.status === "pending" ? "bg-violet-500/6 ring-violet-500/20" : "bg-white/2 ring-white/5",
      )}
    >
      {req.type === "ability" ? (
        <UserAvatar user={msg.user} className="size-8 text-[11px]" />
      ) : (
        <TrackCover src={req.track.thumbnailUrl} className="size-8 rounded-lg" />
      )}
      <p className="min-w-0 flex-1 truncate text-[13px] text-white/50">
        <span className="font-medium text-white/80">{msg.user.name}</span> {verb}
        {req.type !== "ability" && <span className="text-white/80"> {req.track.title}</span>}
      </p>
      {canResolve ? (
        <span className="flex shrink-0 gap-1.5">
          <button
            disabled={!!busy}
            onClick={() => act(true)}
            aria-label="Approve"
            className="grid size-7 place-items-center rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 text-white disabled:opacity-60"
          >
            {busy === "yes" ? <Spinner className="size-3" /> : <HiCheck className="size-3.5" />}
          </button>
          <button
            disabled={!!busy}
            onClick={() => act(false)}
            aria-label="Decline"
            className="grid size-7 place-items-center rounded-full bg-white/8 text-white/60 transition-colors hover:bg-white/15 hover:text-white disabled:opacity-50"
          >
            {busy === "no" ? <Spinner className="size-3" /> : <HiXMark className="size-3.5" />}
          </button>
        </span>
      ) : (
        <span className={cn("shrink-0 text-[11px] font-medium", STATUS[msg.status].className)}>{SHORT_STATUS[msg.status]}</span>
      )}
    </motion.div>
  );
}

export default function RequestCard({ msg }: { msg: RequestMessage }) {
  const { req, busy, act, canResolve } = useRequest(msg);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "rounded-2xl border p-3",
        msg.status === "pending" ? "border-violet-500/25 bg-violet-500/6" : "border-white/5 bg-white/2",
      )}
    >
      <div className="flex items-center gap-2 text-xs text-white/50">
        <UserAvatar user={msg.user} className="size-5 text-[9px]" />
        <span className="min-w-0 truncate">
          <span className="font-medium text-white/80">{msg.user.name}</span>{" "}
          {req.type === "song" ? "wants to play" : req.type === "skip" ? "wants to skip" : `asks to ${ABILITY_LABEL[req.ability]}`}
        </span>
      </div>

      {req.type !== "ability" && (
        <div className="mt-2 flex items-center gap-2.5">
          <TrackCover src={req.track.thumbnailUrl} className="size-10 rounded-lg" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{req.track.title}</p>
            <p className="truncate text-xs text-white/40">{req.track.artist ?? "Unknown artist"}</p>
          </div>
        </div>
      )}

      {canResolve ? (
        <div className="mt-2.5 flex gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={!!busy}
            onClick={() => act(true)}
            className="flex h-8 flex-1 items-center justify-center gap-1 rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 text-xs font-medium text-white disabled:opacity-70"
          >
            {busy === "yes" ? (
              <Spinner className="size-3" />
            ) : (
              <><HiCheck className="size-3.5" /> {req.type === "song" ? "Add to queue" : req.type === "skip" ? "Skip it" : "Allow"}</>
            )}
          </motion.button>
          <button
            disabled={!!busy}
            onClick={() => act(false)}
            className="flex h-8 flex-1 items-center justify-center gap-1 rounded-full bg-white/6 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            {busy === "no" ? <Spinner className="size-3" /> : <><HiXMark className="size-3.5" /> {req.type === "skip" ? "Keep playing" : "Decline"}</>}
          </button>
        </div>
      ) : (
        <p className={cn("mt-2 text-[11px] font-medium", STATUS[msg.status].className)}>{STATUS[msg.status].text}</p>
      )}
    </motion.div>
  );
}
