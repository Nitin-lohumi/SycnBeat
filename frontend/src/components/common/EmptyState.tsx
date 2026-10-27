import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { IconType } from "react-icons";
import { cn } from "../../lib/utils";

type Props = {
  icon: IconType;
  title: string;
  text?: string;
  action?: ReactNode;
  size?: "sm" | "lg";
};

export default function EmptyState({ icon: Icon, title, text, action, size = "sm" }: Props) {
  const lg = size === "lg";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex flex-col items-center text-center", lg ? "py-20" : "py-6")}
    >
      <div
        className={cn(
          "relative isolate grid place-items-center rounded-2xl bg-linear-to-br from-violet-500/15 to-fuchsia-500/10 ring-1 ring-white/10",
          lg ? "size-16" : "size-11",
        )}
      >
        {lg && <div className="absolute inset-0 -z-10 rounded-2xl bg-fuchsia-500/20 blur-2xl" />}
        <Icon className={cn("text-violet-300", lg ? "size-7" : "size-5")} />
      </div>
      <p className={cn("font-medium", lg ? "mt-5 text-lg" : "mt-3 text-sm")}>{title}</p>
      {text && <p className={cn("max-w-xs text-white/40", lg ? "mt-1.5 text-sm" : "mt-1 text-xs")}>{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}
