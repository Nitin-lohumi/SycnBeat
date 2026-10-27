import { cn } from "../lib/utils";
import type { User } from "../types/user";

type Props = {
  user: Pick<User, "name" | "avatarUrl">;
  className?: string;
};

const FALLBACK_COLORS = [
  "from-violet-500 to-fuchsia-500",
  "from-sky-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
];

function colorFor(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash + ch.charCodeAt(0)) % FALLBACK_COLORS.length;
  return FALLBACK_COLORS[hash];
}

export default function UserAvatar({ user, className }: Props) {
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        referrerPolicy="no-referrer"
        className={cn("size-9 shrink-0 rounded-full object-cover ring-1 ring-white/10", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full bg-linear-to-br text-sm font-semibold text-white ring-1 ring-white/10",
        colorFor(user.name),
        className,
      )}
    >
      {user.name[0]?.toUpperCase()}
    </div>
  );
}
