import { create } from "zustand";
import type { Track } from "../features/music/types";

interface AddToPlaylistDialogState {
  track: Track | null;
  open: (track: Track) => void;
  close: () => void;
}

export const useAddToPlaylistDialog = create<AddToPlaylistDialogState>()((set) => ({
  track: null,
  open: (track) => set({ track }),
  close: () => set({ track: null }),
}));
