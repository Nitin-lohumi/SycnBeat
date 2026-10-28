import { relayTyping } from "../services/chat_service";
import { dmTypingSchema } from "../validators/chat";
import type { AppSocket } from "./index";

// Messages go through REST (saved first); only the typing hint is socket-only.
export function registerChatHandlers(socket: AppSocket) {
  const me = socket.data.userId;

  socket.on("dm:typing", (data) => {
    const parsed = dmTypingSchema.safeParse(data);
    if (!parsed.success) return;
    relayTyping(me, parsed.data.conversationId, parsed.data.isTyping).catch(() => {});
  });
}
