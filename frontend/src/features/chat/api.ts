import { api } from "../../api/axios";
import type { ConversationDetail, ConversationSummary, DirectMessage, MessagePage } from "./types";

export async function getConversations() {
  const { data } = await api.get<{ conversations: ConversationSummary[] }>("/api/chats");
  return data.conversations;
}

export async function openConversation(userId: string) {
  const { data } = await api.post<{ conversation: { id: string } }>("/api/chats", { userId });
  return data.conversation.id;
}

export async function getConversation(id: string) {
  const { data } = await api.get<{ conversation: ConversationDetail }>(`/api/chats/${id}`);
  return data.conversation;
}

export async function getMessages(id: string, before?: string) {
  const { data } = await api.get<MessagePage>(`/api/chats/${id}/messages`, { params: { before } });
  return data;
}

export async function sendMessage({ id, content }: { id: string; content: string; tempId: string }) {
  const { data } = await api.post<{ message: DirectMessage }>(`/api/chats/${id}/messages`, { content });
  return data.message;
}

export async function markRead(id: string) {
  await api.post(`/api/chats/${id}/read`);
}
