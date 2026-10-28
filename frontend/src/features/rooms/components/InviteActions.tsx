import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Spinner from "../../../components/common/Spinner";
import { qk } from "../../../lib/queryKeys";
import { useAcceptInvite, useDeclineInvite } from "../hooks";

// Join / Decline for a room invite, used by the toast and the bell menu.
export default function InviteActions({ roomId, onDone }: { roomId: string; onDone?: () => void }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const accept = useAcceptInvite();
  const decline = useDeclineInvite();
  const busy = accept.isPending || decline.isPending;
  const settle = () => {
    qc.invalidateQueries({ queryKey: qk.notifications });
    onDone?.();
  };

  return (
    <div className="flex gap-2">
      <motion.button
        whileTap={busy ? undefined : { scale: 0.95 }}
        disabled={busy}
        onClick={() =>
          accept.mutate(roomId, {
            onSuccess: (id) => navigate(`/rooms/${id}`),
            onSettled: settle,
          })
        }
        className="flex h-7 min-w-18 items-center justify-center rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 px-3.5 text-xs font-medium text-white disabled:opacity-70"
      >
        {accept.isPending ? <Spinner className="size-3" /> : "Join"}
      </motion.button>
      <button
        disabled={busy}
        onClick={() => decline.mutate(roomId, { onSettled: settle })}
        className="flex h-7 min-w-18 items-center justify-center rounded-full bg-white/5 px-3.5 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
      >
        {decline.isPending ? <Spinner className="size-3" /> : "Decline"}
      </button>
    </div>
  );
}
