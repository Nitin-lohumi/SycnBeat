import { createRequest, react, resolveRequest, sendChat } from "../services/live/chat";
import { runCommand } from "../services/live/playback";
import { joinRoom, leaveRoom, onDisconnect } from "../services/live/presence";
import { currentLive } from "../services/live/store";
import { LiveError } from "../services/live/types";
import { AppError } from "../utils/AppError";
import { parse } from "../utils/validate";
import {
  chatSchema,
  joinSchema,
  playbackSchema,
  reactionSchema,
  requestSchema,
  resolveRequestSchema,
  typingSchema,
} from "../validators/room";
import { liveRoom, type Ack, type AppSocket } from "./index";

// Runs a handler and always answers the client's ack, even on errors.
function run(ack: Ack | undefined, fn: () => Promise<Record<string, unknown> | void>) {
  const reply = typeof ack === "function" ? ack : () => {};
  fn()
    .then((data) => reply({ ok: true, ...(data ?? {}) }))
    .catch((e) => {
      if (e instanceof LiveError) return reply({ ok: false, error: e.message, code: e.code, retryIn: e.retryIn });
      if (e instanceof AppError) return reply({ ok: false, error: e.message });
      console.error("[room] socket handler failed", e);
      reply({ ok: false, error: "Something went wrong" });
    });
}

export function registerRoomHandlers(socket: AppSocket) {
  const me = socket.data.userId;

  const inRoom = () => {
    const room = currentLive(me);
    if (!room) throw new LiveError(409, "You are not in a room");
    return room;
  };

  socket.on("time:ping", (ack) => {
    if (typeof ack === "function") ack(Date.now());
  });

  socket.on("room:join", (data, ack) =>
    run(ack, async () => {
      const { roomId } = parse(joinSchema, data, "Invalid room");
      return { snapshot: await joinRoom(socket, roomId) };
    }),
  );

  socket.on("room:leave", (_data, ack) => run(ack, async () => leaveRoom(me)));

  socket.on("room:playback", (data, ack) =>
    run(ack, async () => {
      const room = inRoom();
      await runCommand(room, me, parse(playbackSchema, data, "Invalid command"));
      return { playback: room.playback };
    }),
  );

  socket.on("room:chat", (data, ack) =>
    run(ack, async () => {
      const { text } = parse(chatSchema, data, "Message can't be empty");
      return { message: sendChat(inRoom(), me, text) };
    }),
  );

  socket.on("room:typing", (data) => {
    const room = currentLive(me);
    const parsed = typingSchema.safeParse(data);
    if (!room || !parsed.success || !room.listeners.has(me)) return;
    socket.to(liveRoom(room.id)).emit("room:typing", { userId: me, isTyping: parsed.data.isTyping });
  });

  socket.on("room:reaction", (data) => {
    const room = currentLive(me);
    const parsed = reactionSchema.safeParse(data);
    if (room && parsed.success) react(room, me, parsed.data.emoji);
  });

  socket.on("room:request", (data, ack) =>
    run(ack, async () => {
      const input = parse(requestSchema, data, "Invalid request");
      return { message: await createRequest(inRoom(), me, input) };
    }),
  );

  socket.on("room:request:resolve", (data, ack) =>
    run(ack, async () => {
      const { id, approve } = parse(resolveRequestSchema, data, "Invalid request");
      await resolveRequest(inRoom(), me, id, approve);
    }),
  );

  socket.on("disconnect", () => onDisconnect(socket));
}
