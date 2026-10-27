import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ease } from "../../lib/motion";
import { cn } from "../../lib/utils";
import BackButton from "./BackButton";
import Container from "./Container";

type Props = {
  title: ReactNode;
  leading?: ReactNode;
  back?: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  // On desktop the page fills the screen and only its panels scroll.
  fixed?: boolean;
  children: ReactNode;
};

export const SPLIT = "grid gap-4 lg:grid-cols-5 lg:grid-rows-[minmax(0,1fr)] lg:gap-5";

export default function Page({ title, leading, back, subtitle, actions, fixed = false, children }: Props) {
  return (
    <Container
      className={cn(
        "py-4 sm:py-5",
        fixed && "lg:flex lg:h-[calc(100dvh-4.5rem-var(--player-h,0px))] lg:flex-col",
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="flex shrink-0 flex-wrap items-end justify-between gap-3"
      >
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          {back && <BackButton to={back} />}
          {leading}
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{title}</h1>
            {subtitle && <p className="mt-0.5 line-clamp-2 text-sm text-white/50">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </motion.div>

      <div className={cn("mt-4", fixed && "lg:min-h-0 lg:flex-1")}>{children}</div>
    </Container>
  );
}

export function GradientText({ children }: { children: ReactNode }) {
  return <span className="bg-linear-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">{children}</span>;
}
