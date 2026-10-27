import { useState } from "react";
import { HiMusicalNote } from "react-icons/hi2";
import { cn } from "../../../lib/utils";

export default function TrackCover({ src, alt = "", className }: { src?: string | null; alt?: string; className?: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn("relative shrink-0 overflow-hidden bg-linear-to-br from-violet-600/40 to-fuchsia-600/30", className)}>
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          draggable={false}
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <div className="grid size-full place-items-center text-white/60">
          <HiMusicalNote className="size-1/2 max-h-12 max-w-12" />
        </div>
      )}
    </div>
  );
}
