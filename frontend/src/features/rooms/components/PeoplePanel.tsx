import { useState } from "react";
import { motion } from "framer-motion";
import { FaCrown } from "react-icons/fa6";
import { HiOutlineAdjustmentsHorizontal, HiOutlineQueueList, HiUserMinus, HiUserPlus } from "react-icons/hi2";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import ErrorState from "../../../components/common/ErrorState";
import { UserRowSkeleton } from "../../../components/common/Skeleton";
import UserAvatar from "../../../components/UserAvatar";
import { cn } from "../../../lib/utils";
import { useRoom, useRoomPermissions } from "../../../store/room";
import { useKickMember, useRoomDetail, useSetAbilities } from "../hooks";
import type { Ability, RoomMember } from "../types";

const ABILITIES: { id: Ability; label: string; icon: typeof HiOutlineQueueList }[] = [
  { id: "canQueue", label: "Add songs", icon: HiOutlineQueueList },
  { id: "canControl", label: "Control", icon: HiOutlineAdjustmentsHorizontal },
];

export function PeopleHeader({ onInvite }: { onInvite: () => void }) {
  const { admin } = useRoomPermissions();
  return (
    <>
      <p className="font-semibold">People</p>
      {admin && (
        <button
          onClick={onInvite}
          className="ml-auto flex h-8 items-center gap-1 rounded-full bg-white/8 px-3 text-xs font-medium transition-colors hover:bg-white/15"
        >
          <HiUserPlus className="size-3.5" /> Invite
        </button>
      )}
    </>
  );
}

export default function PeoplePanel() {
  const roomId = useRoom((s) => s.roomId);
  const presence = useRoom((s) => s.presence);
  const meId = useRoom((s) => s.meId);
  const requestAbility = useRoom((s) => s.requestAbility);
  const { owner, admin, canQueue, canControl } = useRoomPermissions();
  const detail = useRoomDetail(roomId);
  const [kicking, setKicking] = useState<RoomMember | null>(null);
  const kick = useKickMember();

  if (detail.isPending) return <div className="p-2">{Array.from({ length: 4 }, (_, i) => <UserRowSkeleton key={i} />)}</div>;
  if (detail.isError) return <ErrorState onRetry={() => detail.refetch()} />;

  const live = new Map(presence?.listeners.map((l) => [l.user.id, l]));
  const listening = detail.data.members.filter((m) => live.has(m.user.id));
  const away = detail.data.members.filter((m) => !live.has(m.user.id));
  const missing = ABILITIES.filter((a) => !(a.id === "canQueue" ? canQueue : canControl));

  const row = (m: RoomMember) => {
    const listener = live.get(m.user.id);
    const isOwner = m.user.id === detail.data.ownerId;
    const isTemp = presence?.tempAdminId === m.user.id;
    const isMe = m.user.id === meId;

    return (
      <motion.div key={m.user.id} layout className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/3">
        <div className="relative">
          <UserAvatar user={m.user} className={cn("size-10", !listener && "opacity-50")} />
          {listener && (
            <span className={cn("absolute right-0 bottom-0 size-2.5 rounded-full ring-2 ring-neutral-950", listener.online ? "bg-emerald-400" : "bg-amber-400")} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-sm font-medium">
            {m.user.name}
            {isMe && <span className="text-xs font-normal text-white/30">(you)</span>}
            {(isOwner || isTemp) && (
              <span className={cn("flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px]", isOwner ? "bg-amber-400/15 text-amber-300" : "bg-sky-400/15 text-sky-300")}>
                <FaCrown className="size-2.5" /> {isOwner ? "Owner" : "Admin"}
              </span>
            )}
          </p>
          {isOwner ? (
            <p className="text-xs text-white/30">Admin</p>
          ) : owner ? (
            <AbilityToggles roomId={detail.data.id} member={m} />
          ) : (
            <p className="truncate text-xs text-white/30">
              {[m.canQueue && "Adds songs", m.canControl && "Controls playback"].filter(Boolean).join(" · ") || "Listener"}
            </p>
          )}
        </div>

        {owner && !isOwner && (
          <button
            onClick={() => setKicking(m)}
            aria-label={`Remove ${m.user.name}`}
            title="Remove from room"
            className="grid size-8 shrink-0 place-items-center rounded-full text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <HiUserMinus className="size-4" />
          </button>
        )}
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col gap-4 p-2">
      {!admin && missing.length > 0 && (
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-3">
          <p className="text-xs text-white/60">Want to help run the room? Ask the owner for:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {missing.map((a) => (
              <motion.button
                key={a.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => requestAbility(a.id)}
                className="flex h-8 items-center gap-1.5 rounded-full bg-white/8 px-3 text-xs font-medium transition-colors hover:bg-white/15"
              >
                <a.icon className="size-3.5" /> {a.label}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      <div>{listening.map(row)}</div>
      {away.length > 0 && (
        <div>
          <p className="mb-1 px-2 text-[11px] font-medium tracking-wider text-white/40 uppercase">Not here · {away.length}</p>
          {away.map(row)}
        </div>
      )}

      <ConfirmDialog
        open={!!kicking}
        onClose={() => setKicking(null)}
        title={`Remove ${kicking?.user.name ?? ""}?`}
        description="They'll be sent out of the room and need a new invite to come back."
        confirmLabel="Remove"
        onConfirm={() => kicking && kick.mutate({ id: detail.data.id, userId: kicking.user.id })}
      />
    </div>
  );
}

const ABILITY_COPY: Record<Ability, { give: string; take: string; what: string }> = {
  canQueue: { give: "add songs", take: "adding songs", what: "add, remove and reorder songs in the queue" },
  canControl: { give: "control playback", take: "playback control", what: "play, pause, skip and seek for everyone" },
};

function AbilityToggles({ roomId, member }: { roomId: string; member: RoomMember }) {
  const set = useSetAbilities();
  const [asking, setAsking] = useState<Ability | null>(null);
  const name = member.user.name;
  const copy = asking && ABILITY_COPY[asking];
  const giving = asking ? !member[asking] : false;

  return (
    <div className="mt-1 flex flex-wrap gap-1.5">
      <ConfirmDialog
        open={!!asking}
        onClose={() => setAsking(null)}
        tone={giving ? "primary" : "danger"}
        title={copy ? (giving ? `Let ${name} ${copy.give}?` : `Take back ${copy.take} from ${name}?`) : ""}
        description={
          copy && (giving ? `They'll be able to ${copy.what}.` : `They can still listen and ask for it again anytime.`)
        }
        confirmLabel={giving ? "Allow" : "Take back"}
        onConfirm={() => asking && set.mutate({ id: roomId, userId: member.user.id, [asking]: giving })}
      />
      {ABILITIES.map((a) => {
        const on = member[a.id];
        return (
          <motion.button
            key={a.id}
            whileTap={{ scale: 0.94 }}
            disabled={set.isPending}
            onClick={() => setAsking(a.id)}
            aria-pressed={on}
            className={cn(
              "flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-medium ring-1 transition-colors",
              on ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30" : "bg-white/4 text-white/40 ring-white/10 hover:text-white/70",
            )}
          >
            <a.icon className="size-3" /> {a.label}
          </motion.button>
        );
      })}
    </div>
  );
}
