import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { HiArrowRightOnRectangle, HiChevronDown, HiOutlineCog6Tooth, HiUserPlus } from "react-icons/hi2";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import Logo from "../../../components/layout/Logo";
import { useRoom, useRoomPermissions } from "../../../store/room";
import type { Listener } from "../types";
import AvatarStack from "./AvatarStack";
import { LiveDot } from "./LiveBadge";

const NO_LISTENERS: Listener[] = [];

const iconBtn =
  "grid size-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/4 text-white/70 transition-colors hover:bg-white/10 hover:text-white";

export default function RoomTopBar({ onInvite, onSettings }: { onInvite: () => void; onSettings: () => void }) {
  const room = useRoom((s) => s.room);
  const listeners = useRoom((s) => s.presence?.listeners ?? NO_LISTENERS);
  const leave = useRoom((s) => s.leave);
  const { owner, admin } = useRoomPermissions();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);

  // Minimizing keeps you in the room; music goes on with the mini card.
  const minimize = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate("/rooms", { replace: true });
  };

  return (
    <header className="relative z-10 flex h-16 shrink-0 items-center gap-3 border-b border-white/10 bg-black/40 px-3 backdrop-blur-xl sm:px-4 lg:px-6">
      <motion.button whileTap={{ scale: 0.9 }} onClick={minimize} aria-label="Minimize room" title="Minimize (you stay in the room)" className={iconBtn}>
        <HiChevronDown className="size-5" />
      </motion.button>
      <div className="hidden lg:block">
        <Logo />
      </div>
      <span className="hidden h-6 w-px bg-white/10 lg:block" />

      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <LiveDot />
        <p className="truncate font-semibold">{room?.name}</p>
        <span title={listeners.map((l) => l.user.name).join(", ")} className="shrink-0">
          <AvatarStack users={listeners.map((l) => l.user)} max={4} />
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {admin && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onInvite}
            className="flex h-9 items-center gap-1.5 rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 px-3 text-sm font-medium text-white shadow-lg shadow-fuchsia-500/20 sm:px-4"
          >
            <HiUserPlus className="size-4" />
            <span className="hidden sm:inline">Invite</span>
          </motion.button>
        )}
        {owner && (
          <button onClick={onSettings} aria-label="Room settings" title="Room settings" className={iconBtn}>
            <HiOutlineCog6Tooth className="size-4.5" />
          </button>
        )}
        <button
          onClick={() => setConfirm(true)}
          className="flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/4 px-3 text-sm text-white/70 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
        >
          <HiArrowRightOnRectangle className="size-4" />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </div>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Leave this room?"
        description={
          owner
            ? "The room stays live while others are listening. You can come back anytime and you'll be admin again."
            : "You can rejoin from the Rooms page while it's live."
        }
        confirmLabel="Leave"
        onConfirm={() => {
          leave();
          navigate("/rooms", { replace: true });
        }}
      />
    </header>
  );
}
