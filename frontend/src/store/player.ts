import { create } from "zustand";
import { toast } from "sonner";
import type { Track } from "../features/music/types";
import { streamUrl, trackKey } from "../features/music/utils";

type Repeat = "off" | "all" | "one";

interface PlayerState {
  queue: Track[];
  index: number;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  repeat: Repeat;
  mode: "solo" | "room";
  expanded: boolean;
  panels: number;

  playQueue: (tracks: Track[], index: number) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  cycleRepeat: () => void;
  close: () => void;
  setExpanded: (expanded: boolean) => void;
  registerPanel: () => () => void;
}

const VOLUME_KEY = "syncbeat:volume";

function savedVolume() {
  try {
    const v = Number(localStorage.getItem(VOLUME_KEY));
    return Number.isFinite(v) && v > 0 && v <= 1 ? v : 0.8;
  } catch {
    return 0.8;
  }
}

// One audio element for the whole app, so music keeps playing across pages.
const audio = new Audio();
audio.preload = "auto";
audio.volume = savedVolume();

function start(track: Track | undefined) {
  if (!track?.audioUrl) return;
  audio.src = streamUrl(track);
  audio.play().catch(() => usePlayer.setState({ isPlaying: false }));
}

export const usePlayer = create<PlayerState>()((set, get) => ({
  queue: [],
  index: -1,
  isPlaying: false,
  isBuffering: false,
  currentTime: 0,
  duration: 0,
  volume: audio.volume,
  muted: false,
  repeat: "off",
  mode: "solo",
  expanded: false,
  panels: 0,

  playQueue: (tracks, index) => {
    const playable = tracks.filter((t) => t.audioUrl);
    const target = tracks[index];
    if (!target?.audioUrl) return;

    const current = get().queue[get().index];
    if (current && trackKey(current) === trackKey(target)) {
      set({ queue: playable, index: playable.indexOf(target) });
      return get().togglePlay();
    }

    set({ queue: playable, index: playable.indexOf(target), currentTime: 0, duration: target.durationSec });
    start(target);
  },

  togglePlay: () => {
    if (get().index < 0) return;
    if (audio.paused) audio.play().catch(() => set({ isPlaying: false }));
    else audio.pause();
  },

  next: () => {
    const { queue, index, repeat } = get();
    if (queue.length === 0) return;
    const nextIndex = index + 1 < queue.length ? index + 1 : repeat === "all" ? 0 : -1;
    if (nextIndex < 0) return;
    set({ index: nextIndex, currentTime: 0, duration: queue[nextIndex].durationSec });
    start(queue[nextIndex]);
  },

  prev: () => {
    const { queue, index } = get();
    if (audio.currentTime > 3 || index <= 0) return get().seek(0);
    set({ index: index - 1, currentTime: 0, duration: queue[index - 1].durationSec });
    start(queue[index - 1]);
  },

  seek: (time) => {
    audio.currentTime = time;
    set({ currentTime: time });
  },

  setVolume: (volume) => {
    audio.volume = volume;
    audio.muted = volume === 0;
    set({ volume, muted: volume === 0 });
    try {
      if (volume > 0) localStorage.setItem(VOLUME_KEY, String(volume));
    } catch {
      /* storage unavailable */
    }
  },

  toggleMute: () => {
    audio.muted = !audio.muted;
    set({ muted: audio.muted });
  },

  cycleRepeat: () => set(({ repeat }) => ({ repeat: repeat === "off" ? "all" : repeat === "all" ? "one" : "off" })),

  close: () => {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    set({ queue: [], index: -1, isPlaying: false, currentTime: 0, duration: 0, expanded: false });
  },

  setExpanded: (expanded) => set({ expanded }),

  // Pages with a big Now Playing panel register so the mini player can hide on desktop.
  registerPanel: () => {
    set(({ panels }) => ({ panels: panels + 1 }));
    return () => set(({ panels }) => ({ panels: panels - 1 }));
  },
}));

export const useCurrentTrack = () => usePlayer((s) => (s.index >= 0 ? s.queue[s.index] : undefined));

let retried = false;
let failures = 0;

audio.addEventListener("play", () => usePlayer.setState({ isPlaying: true }));
audio.addEventListener("pause", () => usePlayer.setState({ isPlaying: false }));
audio.addEventListener("waiting", () => usePlayer.setState({ isBuffering: true }));
audio.addEventListener("playing", () => {
  retried = false;
  failures = 0;
  usePlayer.setState({ isBuffering: false });
});
audio.addEventListener("timeupdate", () => usePlayer.setState({ currentTime: audio.currentTime }));
audio.addEventListener("durationchange", () => {
  if (Number.isFinite(audio.duration)) usePlayer.setState({ duration: audio.duration });
});
audio.addEventListener("ended", () => {
  const { repeat, next, queue, index } = usePlayer.getState();
  if (repeat === "one") {
    audio.currentTime = 0;
    void audio.play();
  } else if (index + 1 < queue.length || repeat === "all") next();
});
// Retry once (network blips), skip if it still fails, and stop after 3 bad songs in a row.
audio.addEventListener("error", () => {
  const err = audio.error;
  if (!audio.getAttribute("src") || err?.code === MediaError.MEDIA_ERR_ABORTED) return;

  const { queue, index, next } = usePlayer.getState();
  const track = queue[index];
  console.warn("Playback failed", { code: err?.code, message: err?.message, src: audio.currentSrc, track });

  if (!retried) {
    retried = true;
    audio.load();
    audio.play().catch(() => {});
    return;
  }

  retried = false;
  failures += 1;
  usePlayer.setState({ isBuffering: false, isPlaying: false });

  if (failures >= 3) {
    failures = 0;
    toast.error("Songs keep failing to load. Check your connection and try again.");
    return;
  }
  toast.error(`Couldn't play "${track?.title ?? "this song"}", skipping`);
  next();
});

// Lock-screen / notification controls on phones.
if ("mediaSession" in navigator) {
  const ms = navigator.mediaSession;
  ms.setActionHandler("play", () => usePlayer.getState().togglePlay());
  ms.setActionHandler("pause", () => usePlayer.getState().togglePlay());
  ms.setActionHandler("nexttrack", () => usePlayer.getState().next());
  ms.setActionHandler("previoustrack", () => usePlayer.getState().prev());

  usePlayer.subscribe((s, prev) => {
    const track = s.queue[s.index];
    if (track === prev.queue[prev.index]) return;
    ms.metadata = track
      ? new MediaMetadata({
          title: track.title,
          artist: track.artist ?? "",
          artwork: track.thumbnailUrl ? [{ src: track.thumbnailUrl, sizes: "300x300" }] : [],
        })
      : null;
  });
}
