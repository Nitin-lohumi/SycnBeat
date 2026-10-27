import type { ReactNode } from "react";
import type { PublicUser } from "../../types/social";
import UserAvatar from "../UserAvatar";

type Props = {
  user: PublicUser;
  meta?: string;
  actions?: ReactNode;
};

export default function UserRow({ user, meta, actions }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/4">
      <UserAvatar user={user} className="size-10" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user.name}</p>
        <p className="truncate text-xs text-white/40">
          @{user.username}
          {meta && <> · {meta}</>}
        </p>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </div>
  );
}
