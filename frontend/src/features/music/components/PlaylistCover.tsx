import { HiHeart, HiMusicalNote } from "react-icons/hi2";
import { cn } from "../../../lib/utils";

// 1 cover fills the tile; 2+ make a 2x2 mosaic.
export default function PlaylistCover({ covers, liked = false, className }: {
  covers: string[];
  liked?: boolean;
  className?: string;
}) {
  const base = cn("relative shrink-0 overflow-hidden rounded-2xl", className);

  if (liked) {
    return (
      <div className={cn(base, "grid place-items-center bg-linear-to-br from-violet-600 via-fuchsia-600 to-pink-500")}>
        <HiHeart className="size-2/5 text-white drop-shadow-lg" />
      </div>
    );
  }

  if (covers.length === 0) {
    return (
      <div className={cn(base, "grid place-items-center bg-linear-to-br from-violet-600/40 to-fuchsia-600/25")}>
        <HiMusicalNote className="size-2/5 text-white/60" />
      </div>
    );
  }

  if (covers.length < 4) {
    return (
      <div className={base}>
        <img src={covers[0]} alt="" loading="lazy" className="size-full object-cover" />
      </div>
    );
  }

  return (
    <div className={cn(base, "grid grid-cols-2 grid-rows-2")}>
      {covers.slice(0, 4).map((src, i) => (
        <img key={i} src={src} alt="" loading="lazy" className="size-full object-cover" />
      ))}
    </div>
  );
}
