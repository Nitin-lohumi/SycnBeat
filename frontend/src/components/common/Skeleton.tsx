import { cn } from "../../lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-white/5 before:absolute before:inset-0 before:animate-shimmer before:bg-linear-to-r before:from-transparent before:via-white/8 before:to-transparent",
        className,
      )}
    />
  );
}

export function UserRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-2 py-2">
      <Skeleton className="size-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-2.5 w-1/4" />
      </div>
      <Skeleton className="h-8 w-20 rounded-full" />
    </div>
  );
}
