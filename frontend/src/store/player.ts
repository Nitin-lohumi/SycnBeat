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
  pendingSolo: { tracks: Track[]; index: number } | null;

  playQueue: (tracks: Track[], index: number) => void;
  clearPendingSolo: () => void;
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

function stopAudio() {
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
  audio.playbackRate = 1;
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
  pendingSolo: null,

  playQueue: (tracks, index) => {
    const playable = tracks.filter((t) => t.audioUrl);
    const target = tracks[index];
    if (!target?.audioUrl) return;
    // In a room the room owns the audio; ask before leaving it.
    if (get().mode === "room") return set({ pendingSolo: { tracks, index } });

    const current = get().queue[get().index];
    if (current && trackKey(current) === trackKey(target)) {
      set({ queue: playable, index: playable.indexOf(target) });
      return get().togglePlay();
    }

    set({ queue: playable, index: playable.indexOf(target), currentTime: 0, duration: target.durationSec });
    start(target);
  },

  clearPendingSolo: () => set({ pendingSolo: null }),

  togglePlay: () => {
    if (get().index < 0 || get().mode === "room") return;
    if (audio.paused) audio.play().catch(() => set({ isPlaying: false }));
    else audio.pause();
  },

  next: () => {
    const { queue, index, repeat, mode } = get();
    if (queue.length === 0 || mode === "room") return;
    const nextIndex = index + 1 < queue.length ? index + 1 : repeat === "all" ? 0 : -1;
    if (nextIndex < 0) return;
    set({ index: nextIndex, currentTime: 0, duration: queue[nextIndex].durationSec });
    start(queue[nextIndex]);
  },

  prev: () => {
    const { queue, index, mode } = get();
    if (mode === "room") return;
    if (audio.currentTime > 3 || index <= 0) return get().seek(0);
    set({ index: index - 1, currentTime: 0, duration: queue[index - 1].durationSec });
    start(queue[index - 1]);
  },

  seek: (time) => {
    if (get().mode === "room") return;
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
    stopAudio();
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

// Room mode: the server's playback state drives the same audio element.
// Resolves false when the browser blocked autoplay and the user must tap first.
export function syncRoomAudio(track: Track | null, position: number, playing: boolean): Promise<boolean> {
  const s = usePlayer.getState();
  if (!track) {
    if (audio.getAttribute("src")) stopAudio();
    usePlayer.setState({ mode: "room", expanded: false, queue: [], index: -1, isPlaying: false, currentTime: 0, duration: 0 });
    return Promise.resolve(true);
  }

  const current = s.queue[s.index];
  if (s.mode !== "room" || !current || trackKey(current) !== trackKey(track)) {
    usePlayer.setState({ mode: "room", expanded: false, queue: [track], index: 0, currentTime: position, duration: track.durationSec });
    audio.src = streamUrl(track);
    audio.playbackRate = 1;
  }
  if (Math.abs(audio.currentTime - position) > 0.5) audio.currentTime = position;

  if (!playing) {
    if (!audio.paused) audio.pause();
    return Promise.resolve(true);
  }
  if (!audio.paused) return Promise.resolve(true);
  return audio.play().then(
    () => true,
    (e: unknown) => !(e instanceof DOMException && e.name === "NotAllowedError"),
  );
}

// Big drift: jump. Small drift: speed up or slow down a little so nobody hears a skip.
export function correctRoomDrift(expected: number) {
  if (usePlayer.getState().mode !== "room" || audio.paused || audio.readyState < 3) return;
  const drift = audio.currentTime - expected;
  if (Math.abs(drift) > 0.5) {
    audio.currentTime = expected;
    audio.playbackRate = 1;
  } else if (Math.abs(drift) > 0.08) {
    audio.playbackRate = drift > 0 ? 0.95 : 1.05;
  } else {
    audio.playbackRate = 1;
  }
}

export function exitRoomAudio() {
  if (usePlayer.getState().mode !== "room") return;
  stopAudio();
  usePlayer.setState({ mode: "solo", queue: [], index: -1, isPlaying: false, isBuffering: false, currentTime: 0, duration: 0 });
}

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
  const { repeat, next, queue, index, mode } = usePlayer.getState();
  if (mode === "room") return;
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

  if (usePlayer.getState().mode === "room") {
    toast.error(`Couldn't play "${track?.title ?? "this song"}" on your device`, { position: "top-right", duration: 1000 });
    return;
  }

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
