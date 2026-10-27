import type { ComponentProps } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

type Props = ComponentProps<typeof motion.button> & { label: string };

export default function IconButton({ label, className, children, ...props }: Props) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      aria-label={label}
      className={cn(
        "relative grid size-9 place-items-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white",
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
