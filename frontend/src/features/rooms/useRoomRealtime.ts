import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { roomToast } from "./toast";
import { useMe } from "../../hooks/useAuth";
import { qk } from "../../lib/queryKeys";
import { correctRoomDrift } from "../../store/player";
import {
  addReaction,
  applyPlayback,
  pushChat,
  savedRoomId,
  setTyping,
  updateChat,
  useRoom,
} from "../../store/room";
import { socket } from "../realtime/socket";
import { syncRooms } from "./hooks";
import { expectedPosition } from "./live";
import type { ChatMessage, LeaveReason, PlaybackState, PresenceState } from "./types";

const LEAVE_TOAST: Partial<Record<LeaveReason, string>> = {
  kicked: "You were removed from the room",
  ended: "The room was deleted by its owner",
  disconnected: "You were disconnected from the room",
};

// Live events only matter once this tab has joined; stray ones after leaving are dropped.
const inRoom =
  <A,>(fn: (arg: A) => void) =>
  (arg: A) => {
    if (useRoom.getState().status === "live") fn(arg);
  };

// Must run before useRealtime connects, so the first "connect" is seen here too.
export function useRoomRealtime() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const meId = me?.id ?? null;

  useEffect(() => {
    useRoom.getState().setMe(meId);
  }, [meId]);

  useEffect(() => {
    const current = () => useRoom.getState().roomId;

    // Fresh socket (first load, refresh or reconnect): get back into the room we were in.
    const onConnect = () => {
      const roomId = current() ?? savedRoomId();
      if (!roomId) return;
      useRoom
        .getState()
        .join(roomId, { rejoin: true })
        .catch((e: Error) => roomToast.error(e.message));
    };

    const handlers = {
      "rooms:changed": () => qc.invalidateQueries({ queryKey: qk.rooms }),
      "room:left": ({ roomId, reason }: { roomId: string; reason: LeaveReason }) => {
        const s = useRoom.getState();
        if (current() === roomId) {
          const iDeletedIt = reason === "ended" && s.room?.ownerId === s.meId;
          s.reset();
          const msg = LEAVE_TOAST[reason];
          if (msg && !iDeletedIt) roomToast.message(msg);
        }
        syncRooms(qc, roomId);
      },
      "room:updated": (info: { name: string; description: string | null }) => {
        useRoom.setState((s) => (s.room ? { room: { ...s.room, ...info } } : {}));
        syncRooms(qc, current());
      },
      "room:presence": inRoom((presence: PresenceState) => useRoom.setState({ presence })),
      "room:playback": inRoom((playback: PlaybackState) => {
        useRoom.setState({ playback });
        applyPlayback(playback);
      }),
      "room:queue:changed": () => {
        const id = current();
        if (id) qc.invalidateQueries({ queryKey: qk.roomQueue(id) });
      },
      "room:members:changed": () => {
        const id = current();
        if (id) syncRooms(qc, id);
      },
      "room:chat": inRoom((msg: ChatMessage) => {
        pushChat(msg);
        if (msg.kind === "system" && msg.event === "admin" && msg.userId === useRoom.getState().meId) {
          roomToast.message("You're now the admin of this room", { icon: "👑" });
        }      }),
      "room:chat:update": inRoom(updateChat),
      "room:typing": inRoom(({ userId, isTyping }: { userId: string; isTyping: boolean }) => setTyping(userId, isTyping)),
      "room:reaction": inRoom(({ userId, emoji }: { userId: string; emoji: string }) => addReaction(userId, emoji)),
    } as const;

    socket.on("connect", onConnect);
    for (const [event, fn] of Object.entries(handlers)) socket.on(event as keyof typeof handlers, fn as never);

    const drift = setInterval(() => {
      const { playback, status } = useRoom.getState();
      if (status === "live" && playback?.isPlaying) correctRoomDrift(expectedPosition(playback));
    }, 1000);

    return () => {
      socket.off("connect", onConnect);
      for (const [event, fn] of Object.entries(handlers)) socket.off(event as keyof typeof handlers, fn as never);
      clearInterval(drift);
    };
  }, [qc]);
}
