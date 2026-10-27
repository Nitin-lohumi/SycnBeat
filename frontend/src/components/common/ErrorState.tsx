import { HiArrowPath, HiOutlineExclamationTriangle } from "react-icons/hi2";

export default function ErrorState({ onRetry, text = "Couldn't load this" }: { onRetry: () => void; text?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center text-sm text-white/50">
      <HiOutlineExclamationTriangle className="size-6 text-amber-400/70" />
      {text}
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 rounded-full bg-white/5 px-3.5 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <HiArrowPath className="size-3.5" /> Retry
      </button>
    </div>
  );
}
