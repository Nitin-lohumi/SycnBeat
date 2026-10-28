import { z } from "zod";

const id = z.string().min(1);

export const openChatSchema = z.object({ userId: id });
export const chatIdSchema = z.object({ id });
export const messagesQuerySchema = z.object({
  before: id.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
});
export const sendMessageSchema = z.object({ content: z.string().trim().min(1, "Message can't be empty").max(2000) });
export const dmTypingSchema = z.object({ conversationId: id, isTyping: z.boolean() });
