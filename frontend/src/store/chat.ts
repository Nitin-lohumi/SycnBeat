import { create } from "zustand";

interface ChatState {
  openId: string | null; // conversation on screen, its messages are marked read right away
  typing: Record<string, boolean>;
  setOpen: (id: string | null) => void;
  setTyping: (conversationId: string, isTyping: boolean) => void;
}

const timers = new Map<string, ReturnType<typeof setTimeout>>();

export const useChatStore = create<ChatState>()((set, get) => ({
  openId: null,
  typing: {},
  setOpen: (openId) => set({ openId }),
  setTyping: (conversationId, isTyping) => {
    clearTimeout(timers.get(conversationId));
    set((s) => ({ typing: { ...s.typing, [conversationId]: isTyping } }));
    // Safety net in case "stopped typing" never arrives.
    if (isTyping) timers.set(conversationId, setTimeout(() => get().setTyping(conversationId, false), 5000));
  },
}));
