import { AnimatePresence, motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { HiOutlineChatBubbleOvalLeft } from "react-icons/hi2";
import { cn } from "../../../lib/utils";
import { useCounts } from "../../notifications/hooks";

export default function MessagesButton() {
  const { data: counts } = useCounts();
  const badge = counts?.messages ?? 0;

  return (
    <NavLink
      to="/messages"
      aria-label="Messages"
      title="Messages"
      className={({ isActive }) =>
        cn(
          "relative grid size-9 place-items-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white",
          isActive && "bg-white/10 text-white",
        )
      }
    >
      <HiOutlineChatBubbleOvalLeft className="size-5" />
      <AnimatePresence>
        {badge > 0 && (
          <motion.span
            key={badge}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
            className="absolute -top-0.5 -right-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-fuchsia-500 px-1 text-[10px] leading-none font-semibold text-white ring-2 ring-black"
          >
            {badge > 9 ? "9+" : badge}
          </motion.span>
        )}
      </AnimatePresence>
    </NavLink>
  );
}
