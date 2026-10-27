import { useRef, useState, type PointerEvent } from "react";
import { cn } from "../../lib/utils";

type Props = {
  value: number;
  max: number;
  onChange?: (value: number) => void;
  onCommit?: (value: number) => void;
  label: string;
  className?: string;
};

// Pointer-based so it drags smoothly with mouse and touch alike.
export default function Slider({ value, max, onChange, onCommit, label, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const shown = drag ?? value;
  const pct = max > 0 ? Math.min(100, (shown / max) * 100) : 0;

  const valueAt = (e: PointerEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    return Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)) * max;
  };

  const move = (e: PointerEvent) => {
    const v = valueAt(e);
    setDrag(v);
    onChange?.(v);
  };

  return (
    <div
      ref={ref}
      role="slider"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      aria-valuenow={Math.round(shown)}
      onPointerDown={(e) => {
        if (max <= 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e);
      }}
      onPointerMove={(e) => drag !== null && move(e)}
      onPointerUp={(e) => {
        if (drag === null) return;
        onCommit?.(valueAt(e));
        setDrag(null);
      }}
      onPointerCancel={() => setDrag(null)}
      className={cn("group relative flex h-5 cursor-pointer touch-none items-center", className)}
    >
      <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/15 transition-[height] group-hover:h-1.5">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div
        className={cn(
          "absolute size-3.5 -translate-x-1/2 rounded-full bg-white shadow-md shadow-black/40 transition-[opacity,scale]",
          drag !== null ? "scale-110 opacity-100" : "scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100",
        )}
        style={{ left: `${pct}%` }}
      />
    </div>
  );
}
