import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import Modal from "../../../components/common/Modal";
import Spinner from "../../../components/common/Spinner";
import { cn } from "../../../lib/utils";

type Values = { name: string; description: string };

type Props = {
  open: boolean;
  title: string;
  submitLabel: string;
  initial?: Values;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: { name: string; description: string | null }) => void;
  footer?: ReactNode;
};

// Shared by "Create room" and the room settings rename.
export default function RoomFormDialog({ open, title, submitLabel, initial, saving, onClose, onSubmit, footer }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(0);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
    setError(false);
  }, [open, initial?.name, initial?.description]);

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) {
            setError(true);
            setShake((n) => n + 1);
            nameRef.current?.focus();
            return;
          }
          onSubmit({ name: name.trim(), description: description.trim() || null });
        }}
        className="flex flex-col gap-4 p-5"
      >
        <motion.div key={shake} animate={shake ? { x: [0, -8, 8, -5, 5, 0] } : undefined} transition={{ duration: 0.35 }}>
          <label className="mb-1.5 block text-xs font-medium text-white/50">Room name *</label>
          <input
            ref={nameRef}
            autoFocus
            value={name}
            maxLength={60}
            onChange={(e) => {
              setName(e.target.value);
              if (e.target.value.trim()) setError(false);
            }}
            placeholder="Lofi night, Road trip…"
            aria-invalid={error}
            className={cn(
              "h-11 w-full rounded-xl border bg-white/4 px-3 text-sm outline-none placeholder:text-white/25",
              error ? "border-red-500/60" : "border-white/10 focus:border-violet-500/50",
            )}
          />
          {error && <p className="mt-1.5 text-xs text-red-400">Give your room a name</p>}
        </motion.div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">Description</label>
          <textarea
            value={description}
            maxLength={300}
            rows={3}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's the vibe? (optional)"
            className="w-full resize-none rounded-xl border border-white/10 bg-white/4 px-3 py-2.5 text-sm outline-none placeholder:text-white/25 focus:border-violet-500/50"
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={saving}
          className="flex h-11 items-center justify-center rounded-xl bg-linear-to-r from-violet-500 to-fuchsia-500 text-sm font-medium text-white shadow-lg shadow-fuchsia-500/20 transition-[filter] hover:brightness-110 disabled:opacity-60"
        >
          {saving ? <Spinner className="size-4" /> : submitLabel}
        </motion.button>
        {footer}
      </form>
    </Modal>
  );
}
