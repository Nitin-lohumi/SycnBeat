import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMe } from "../../hooks/useAuth";
import { qk } from "../../lib/queryKeys";
import { useChatStore } from "../../store/chat";
import { socket } from "../realtime/socket";
import { showMessageToast } from "../realtime/toasts";
import { getConversations, markRead } from "./api";
import { addMessage, markMineSeen, syncChats } from "./hooks";
import type { DirectMessage } from "./types";

export function useChatRealtime() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const meId = me?.id;

  useEffect(() => {
    if (!meId) return;

    const onNew = async (msg: DirectMessage) => {
      addMessage(qc, msg);
      if (msg.senderId === meId) return void qc.invalidateQueries({ queryKey: qk.chats });

      useChatStore.getState().setTyping(msg.conversationId, false);
      const open = useChatStore.getState().openId === msg.conversationId;
      // Only mark it seen if they can actually see it; a hidden tab catches up when it's shown again.
      if (open && document.visibilityState === "visible") await markRead(msg.conversationId).catch(() => {});
      await syncChats(qc);
      // On the Messages page the list and badges already show it, no toast needed.
      if (open || window.location.pathname.startsWith("/messages")) return;

      const list = await qc.fetchQuery({ queryKey: qk.chats, queryFn: getConversations });
      const sender = list.find((c) => c.id === msg.conversationId)?.user;
      if (sender) showMessageToast(sender, msg.content, msg.conversationId);
    };

    const onRead = ({ conversationId, readerId, readAt }: { conversationId: string; readerId: string; readAt: string }) => {
      if (readerId === meId) syncChats(qc);
      else markMineSeen(qc, conversationId, meId, readAt);
    };

    const onTyping = ({ conversationId, isTyping }: { conversationId: string; isTyping: boolean }) =>
      useChatStore.getState().setTyping(conversationId, isTyping);

    // Messages may have arrived while offline.
    const onConnect = () => {
      syncChats(qc);
      qc.invalidateQueries({ queryKey: qk.chatMessagesAll });
    };

    socket.on("dm:new", onNew);
    socket.on("dm:read", onRead);
    socket.on("dm:typing", onTyping);
    socket.on("connect", onConnect);
    return () => {
      socket.off("dm:new", onNew);
      socket.off("dm:read", onRead);
      socket.off("dm:typing", onTyping);
      socket.off("connect", onConnect);
    };
  }, [qc, meId]);
}
