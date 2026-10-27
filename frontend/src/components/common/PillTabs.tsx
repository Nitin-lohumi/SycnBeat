import { motion } from "framer-motion";
import type { IconType } from "react-icons";
import { cn } from "../../lib/utils";

export type PillTab<T extends string> = {
  id: T;
  label: string;
  icon: IconType;
  count?: number;
  highlight?: boolean;
};

type Props<T extends string> = {
  tabs: readonly PillTab<T>[];
  value: T;
  onChange: (id: T) => void;
  layoutId: string;
  className?: string;
};

export default function PillTabs<T extends string>({ tabs, value, onChange, layoutId, className }: Props<T>) {
  return (
    <div className={cn("flex gap-1 rounded-full bg-white/4 p-1", className)}>
      {tabs.map(({ id, label, icon: Icon, count, highlight }) => {
        const active = value === id;
        return (
          <button key={id} onClick={() => onChange(id)} className="relative rounded-full px-3.5 py-1.5 text-sm whitespace-nowrap">
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-white/10 ring-1 ring-white/10"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span
              className={cn(
                "relative flex items-center gap-2 transition-colors",
                active ? "text-white" : "text-white/50 hover:text-white",
              )}
            >
              <Icon className="size-4" />
              {label}
              {!!count && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] leading-none",
                    highlight ? "bg-fuchsia-500 text-white" : "bg-white/10 text-white/60",
                  )}
                >
                  {count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
