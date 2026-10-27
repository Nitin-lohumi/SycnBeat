import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { HiArrowLeft } from "react-icons/hi2";

// Goes back in history when possible, otherwise to the fallback route (e.g. opened from a shared link).
export default function BackButton({ to }: { to: string }) {
  const navigate = useNavigate();

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ x: -2 }}
      onClick={() => {
        const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
        if (idx > 0) navigate(-1);
        else navigate(to, { replace: true });
      }}
      aria-label="Go back"
      title="Back"
      className="grid size-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/4 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
    >
      <HiArrowLeft className="size-4.5" />
    </motion.button>
  );
}
