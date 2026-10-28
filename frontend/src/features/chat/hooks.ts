import { useMemo } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useMe } from "../../hooks/useAuth";
import { errorMessage } from "../../lib/errors";
import { qk } from "../../lib/queryKeys";
import { getConversation, getConversations, getMessages, markRead, openConversation, sendMessage } from "./api";
import type { ConversationSummary, DirectMessage, MessagePage } from "./types";

type Pages = InfiniteData<MessagePage, string | undefined>;

export const useConversations = () => useQuery({ queryKey: qk.chats, queryFn: getConversations });

// Header shows instantly from the chat list while the details load.
export function useConversation(id: string) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: qk.chat(id),
    queryFn: () => getConversation(id),
    retry: false,
    staleTime: 5 * 60_000,
    placeholderData: () => {
      const c = qc.getQueryData<ConversationSummary[]>(qk.chats)?.find((x) => x.id === id);
      return c && { id: c.id, user: c.user, isFriend: true };
    },
  });
}

const messagesQuery = (id: string) => ({
  queryKey: qk.chatMessages(id),
  queryFn: ({ pageParam }: { pageParam: string | undefined }) => getMessages(id, pageParam),
  initialPageParam: undefined as string | undefined,
  getNextPageParam: (last: MessagePage) => last.nextCursor ?? undefined,
  // Socket events keep it fresh; it is refetched only after a reconnect.
  staleTime: Infinity,
});

// Hovering a chat in the list loads it early, so opening feels instant.
export function usePrefetchChat() {
  const qc = useQueryClient();
  return (id: string) => void qc.prefetchInfiniteQuery(messagesQuery(id));
}

// Pages come newest-first from the API; flattened oldest -> newest for display.
export function useMessages(id: string) {
  const query = useInfiniteQuery(messagesQuery(id));
  const messages = useMemo(() => [...(query.data?.pages ?? [])].reverse().flatMap((p) => p.messages), [query.data]);
  return { ...query, messages };
}

export function syncChats(qc: QueryClient) {
  return Promise.all([qk.chats, qk.counts].map((queryKey) => qc.invalidateQueries({ queryKey })));
}

// Adds a message to the newest page unless it's already there (socket and HTTP can both deliver it).
export function addMessage(qc: QueryClient, msg: DirectMessage) {
  qc.setQueryData<Pages>(qk.chatMessages(msg.conversationId), (data) => {
    if (!data || data.pages.some((p) => p.messages.some((m) => m.id === msg.id))) return data;
    const [first, ...rest] = data.pages;
    return { ...data, pages: [{ ...first, messages: [...first.messages, msg] }, ...rest] };
  });
}

function removeMessage(qc: QueryClient, conversationId: string, id: string) {
  qc.setQueryData<Pages>(qk.chatMessages(conversationId), (data) =>
    data && { ...data, pages: data.pages.map((p) => ({ ...p, messages: p.messages.filter((m) => m.id !== id) })) },
  );
}

// The other person read the chat: every message I sent is now seen.
export function markMineSeen(qc: QueryClient, conversationId: string, meId: string, readAt: string) {
  qc.setQueryData<Pages>(qk.chatMessages(conversationId), (data) =>
    data && {
      ...data,
      pages: data.pages.map((p) => ({
        ...p,
        messages: p.messages.map((m) => (m.senderId === meId && !m.readAt && !m.pending ? { ...m, readAt } : m)),
      })),
    },
  );
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: markRead, onSettled: () => syncChats(qc) });
}

export function useSendMessage() {
  const qc = useQueryClient();
  const { data: me } = useMe();

  return useMutation({
    mutationFn: sendMessage,
    onMutate: ({ id, content, tempId }) => {
      addMessage(qc, {
        id: tempId,
        conversationId: id,
        senderId: me?.id ?? "",
        content,
        readAt: null,
        createdAt: new Date().toISOString(),
        pending: true,
      });
    },
    onSuccess: (msg, { tempId }) => {
      removeMessage(qc, msg.conversationId, tempId);
      addMessage(qc, msg);
    },
    onError: (e, { id, tempId }) => {
      removeMessage(qc, id, tempId);
      toast.error(errorMessage(e, "Message not sent"));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.chats }),
  });
}

// Friends page "Chat" button. A chat we already know opens instantly; only a brand-new one asks the server.
export function useOpenChat() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const known = (userId: string) =>
    qc.getQueryData<string>(qk.chatWith(userId)) ??
    qc.getQueryData<ConversationSummary[]>(qk.chats)?.find((c) => c.user.id === userId)?.id;

  return useMutation({
    mutationFn: async (userId: string) => known(userId) ?? openConversation(userId),
    onSuccess: (id, userId) => {
      qc.setQueryData(qk.chatWith(userId), id);
      navigate(`/messages/${id}`);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}
