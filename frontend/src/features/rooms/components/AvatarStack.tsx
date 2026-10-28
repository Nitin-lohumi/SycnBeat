import UserAvatar from "../../../components/UserAvatar";
import { cn } from "../../../lib/utils";
import type { PublicUser } from "../../../types/user";

export default function AvatarStack({
  users,
  total = users.length,
  max = 4,
  className,
}: {
  users: PublicUser[];
  total?: number;
  max?: number;
  className?: string;
}) {
  const shown = users.slice(0, max);
  const extra = total - shown.length;
  if (shown.length === 0) return null;

  return (
    <div className={cn("flex items-center -space-x-2", className)}>
      {shown.map((u) => (
        <UserAvatar key={u.id} user={u} className="size-6 text-[10px] ring-2 ring-neutral-950" />
      ))}
      {extra > 0 && (
        <span className="grid size-6 place-items-center rounded-full bg-white/10 text-[10px] text-white/70 ring-2 ring-neutral-950">
          +{extra}
        </span>
      )}
    </div>
  );
}
