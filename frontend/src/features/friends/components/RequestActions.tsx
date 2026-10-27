import { motion } from "framer-motion";
import { HiCheck, HiXMark } from "react-icons/hi2";
import { useAcceptFriendRequest, useDeleteFriendRequest } from "../hooks";
import type { FriendRequest } from "../types";

export default function RequestActions({ request }: { request: FriendRequest }) {
  const accept = useAcceptFriendRequest();
  const reject = useDeleteFriendRequest();
  const vars = { requestId: request.id, userId: request.user.id };

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.06 }}
        onClick={() => accept.mutate({ ...vars, user: request.user })}
        aria-label={`Accept ${request.user.name}`}
        className="grid size-8 place-items-center rounded-full bg-linear-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-fuchsia-500/25"
      >
        <HiCheck className="size-4" />
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => reject.mutate({ ...vars, incoming: true })}
        aria-label={`Reject ${request.user.name}`}
        className="grid size-8 place-items-center rounded-full bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
      >
        <HiXMark className="size-4" />
      </motion.button>
    </>
  );
}
