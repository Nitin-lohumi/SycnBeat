import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { roomToast } from "../features/rooms/toast";
import { socket } from "../features/realtime/socket";
import { emitRoom, expectedPosition, RoomActionError, syncClock } from "../features/rooms/live";
import type {
  Ability,
  ChatMessage,
  PlaybackAction,
  PlaybackState,
  PresenceState,
  RoomInfo,
  RoomSnapshot,
} from "../features/rooms/types";
import type { TrackRef } from "../features/music/types";
import { exitRoomAudio, syncRoomAudio } from "./player";

type Reaction = { id: number; userId: string; emoji: string; x: number };

interface RoomState {
  roomId: string | null;
  status: "idle" | "joining" | "live";
  room: RoomInfo | null;
  presence: PresenceState | null;
  playback: PlaybackState | null;
  chat: ChatMessage[];
  typing: string[];
  reactions: Reaction[];
  unread: number;
  chatOpen: boolean;
  needsTap: boolean;
  meId: string | null;

  join: (roomId: string, opts?: { rejoin?: boolean }) => Promise<void>;
  leave: () => void;
  reset: () => void;
  control: (action: PlaybackAction) => Promise<void>;
  requestSkip: () => Promise<void>;
  sendChat: (text: string) => Promise<boolean>;
  react: (emoji: string) => void;
  requestSong: (track: TrackRef) => Promise<boolean>;
  requestAbility: (ability: Ability) => Promise<void>;
  resolveRequest: (id: string, approve: boolean) => Promise<void>;
  setChatOpen: (open: boolean) => void;
  unlockAudio: () => void;
  setMe: (id: string | null) => void;
}

const SESSION_KEY = "syncbeat:room";
const MAX_CHAT = 100;

export const savedRoomId = () => {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
};

function saveRoomId(id: string | null) {
  try {
    if (id) sessionStorage.setItem(SESSION_KEY, id);
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable */
  }
}

const initial = {
  roomId: null,
  status: "idle" as const,
  room: null,
  presence: null,
  playback: null,
  chat: [],
  typing: [],
  reactions: [],
  unread: 0,
  needsTap: false,
};

function showError(e: unknown) {
  if (!(e instanceof RoomActionError)) return roomToast.error("Something went wrong");
  // Fixed id so quick repeats replace one toast instead of stacking.
  if (e.code === "STALE") return roomToast.message("Someone just changed the song", { id: "room-stale", icon: "🎵", duration: 1000 });
  if (e.code === "COOLDOWN") return;
  roomToast.error(e.message);
}

let joinPromise: Promise<void> | null = null;
let reactionId = 0;
const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const useRoom = create<RoomState>()((set, get) => ({
  ...initial,
  chatOpen: false,
  meId: null,

  join: (roomId, { rejoin = false } = {}) => {
    const s = get();
    if (!rejoin && s.roomId === roomId && s.status === "live") return Promise.resolve();
    if (joinPromise && s.roomId === roomId) return joinPromise;

    // Switching rooms: leave the old one first so the server and this tab agree.
    if (s.roomId && s.roomId !== roomId) emitRoom("room:leave").catch(() => {});
    if (!rejoin || s.roomId !== roomId) set({ ...initial, roomId, status: "joining" });

    joinPromise = (async () => {
      try {
        await syncClock();
        const { snapshot } = await emitRoom<{ snapshot: RoomSnapshot }>("room:join", { roomId });
        if (get().roomId !== roomId) return;
        set({
          status: "live",
          room: snapshot.room,
          presence: snapshot.presence,
          playback: snapshot.playback,
          chat: snapshot.chat,
        });
        saveRoomId(roomId);
        applyPlayback(snapshot.playback);
      } catch (e) {
        if (get().roomId === roomId) get().reset();
        throw e;
      } finally {
        joinPromise = null;
      }
    })();
    return joinPromise;
  },

  leave: () => {
    const { roomId } = get();
    get().reset();
    if (roomId) emitRoom("room:leave").catch(() => {});
  },

  reset: () => {
    exitRoomAudio();
    saveRoomId(null);
    typingTimers.forEach(clearTimeout);
    typingTimers.clear();
    set(initial);
  },

  control: async (action) => {
    const playback = get().playback;
    if (!playback) return;
    try {
      await emitRoom("room:playback", { ...action, version: playback.version });
    } catch (e) {
      showError(e);
    }
  },

  requestSkip: async () => {
    try {
      await emitRoom("room:request", { type: "skip" });
    } catch (e) {
      showError(e);
    }
  },

  sendChat: async (text) => {
    try {
      await emitRoom("room:chat", { text });
      return true;
    } catch (e) {
      showError(e);
      return false;
    }
  },

  react: (emoji) => socket.emit("room:reaction", { emoji }),

  requestSong: async (track) => {
    try {
      await emitRoom("room:request", { type: "song", track });
      roomToast.success("Request sent to the admin");
      return true;
    } catch (e) {
      showError(e);
      return false;
    }
  },

  requestAbility: async (ability) => {
    try {
      await emitRoom("room:request", { type: "ability", ability });
      roomToast.success("Request sent to the owner");
    } catch (e) {
      showError(e);
    }
  },

  resolveRequest: async (id, approve) => {
    try {
      await emitRoom("room:request:resolve", { id, approve });
    } catch (e) {
      showError(e);
    }
  },

  setChatOpen: (chatOpen) => set(chatOpen ? { chatOpen, unread: 0 } : { chatOpen }),

  unlockAudio: () => {
    const { playback } = get();
    if (playback) applyPlayback(playback);
  },

  setMe: (meId) => set({ meId }),
}));

export function applyPlayback(p: PlaybackState) {
  void syncRoomAudio(p.track, expectedPosition(p), p.isPlaying).then((ok) => {
    if (useRoom.getState().playback === p) useRoom.setState({ needsTap: !ok });
  });
}

export function pushChat(msg: ChatMessage) {
  useRoom.setState((s) => {
    const fromOther = msg.kind !== "system" && msg.user.id !== s.meId;
    return {
      chat: [...s.chat, msg].slice(-MAX_CHAT),
      unread: fromOther && !s.chatOpen ? s.unread + 1 : s.unread,
    };
  });
}

export function updateChat(msg: ChatMessage) {
  useRoom.setState((s) => ({ chat: s.chat.map((m) => (m.id === msg.id ? msg : m)) }));
}

export function setTyping(userId: string, isTyping: boolean) {
  clearTimeout(typingTimers.get(userId));
  typingTimers.delete(userId);
  useRoom.setState((s) => ({ typing: s.typing.filter((id) => id !== userId).concat(isTyping ? [userId] : []) }));
  // Safety net in case the "stopped typing" event never arrives.
  if (isTyping) typingTimers.set(userId, setTimeout(() => setTyping(userId, false), 5000));
}

export function addReaction(userId: string, emoji: string) {
  const id = ++reactionId;
  useRoom.setState((s) => ({ reactions: [...s.reactions, { id, userId, emoji, x: Math.random() }].slice(-30) }));
  setTimeout(() => useRoom.setState((s) => ({ reactions: s.reactions.filter((r) => r.id !== id) })), 2400);
}

// Who can do what, from the live presence (the owner is always admin).
export function useRoomPermissions() {
  return useRoom(
    useShallow((s) => {
      const me = s.meId;
      const owner = !!me && s.room?.ownerId === me;
      const admin = owner || (!!me && s.presence?.tempAdminId === me);
      const listener = s.presence?.listeners.find((l) => l.user.id === me);
      return { owner, admin, canQueue: admin || !!listener?.canQueue, canControl: admin || !!listener?.canControl };
    }),
  );
}
