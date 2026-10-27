import { motion } from "framer-motion";
import { HiCheck, HiXMark } from "react-icons/hi2";
import Spinner from "../../../components/common/Spinner";
import { useAcceptFriendRequest, useDeleteFriendRequest } from "../hooks";
import type { FriendRequest } from "../types";

export default function RequestActions({ request }: { request: FriendRequest }) {
  const accept = useAcceptFriendRequest();
  const reject = useDeleteFriendRequest();
  const busy = accept.isPending || reject.isPending;

  return (
    <>
      <motion.button
        whileTap={busy ? undefined : { scale: 0.9 }}
        disabled={busy}
        onClick={() => accept.mutate(request.id)}
        aria-label={`Accept ${request.user.name}`}
        className="grid size-8 place-items-center rounded-full bg-linear-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-fuchsia-500/25 disabled:opacity-70"
      >
        {accept.isPending ? <Spinner className="size-3.5" /> : <HiCheck className="size-4" />}
      </motion.button>
      <motion.button
        whileTap={busy ? undefined : { scale: 0.9 }}
        disabled={busy}
        onClick={() => reject.mutate(request.id)}
        aria-label={`Reject ${request.user.name}`}
        className="grid size-8 place-items-center rounded-full bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
      >
        {reject.isPending ? <Spinner className="size-3.5" /> : <HiXMark className="size-4" />}
      </motion.button>
    </>
  );
}
