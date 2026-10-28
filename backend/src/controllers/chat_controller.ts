import type { Request, Response } from "express";
import {
  getConversation,
  listConversations,
  listMessages,
  markConversationRead,
  openConversation,
  sendMessage,
} from "../services/chat_service";
import { parse } from "../utils/validate";
import { chatIdSchema, messagesQuerySchema, openChatSchema, sendMessageSchema } from "../validators/chat";

const chatId = (req: Request) => parse(chatIdSchema, req.params, "Invalid chat id").id;

export async function getAll(req: Request, res: Response) {
  res.json({ conversations: await listConversations(req.userId!) });
}

export async function open(req: Request, res: Response) {
  const { userId } = parse(openChatSchema, req.body, "userId is required");
  res.json({ conversation: await openConversation(req.userId!, userId) });
}

export async function getOne(req: Request, res: Response) {
  res.json({ conversation: await getConversation(req.userId!, chatId(req)) });
}

export async function messages(req: Request, res: Response) {
  const { before, limit } = parse(messagesQuerySchema, req.query, "Invalid query");
  res.json(await listMessages(req.userId!, chatId(req), before, limit));
}

export async function send(req: Request, res: Response) {
  const { content } = parse(sendMessageSchema, req.body, "Message can't be empty");
  res.status(201).json({ message: await sendMessage(req.userId!, chatId(req), content) });
}

export async function read(req: Request, res: Response) {
  await markConversationRead(req.userId!, chatId(req));
  res.status(204).end();
}
