import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useParams } from "react-router-dom";
import { HiArrowLeft, HiOutlineChatBubbleLeftRight, HiPencilSquare } from "react-icons/hi2";
import EmptyState from "../components/common/EmptyState";
import Panel from "../components/common/Panel";
import Page, { GradientText, SPLIT } from "../components/layout/Page";
import { cn } from "../lib/utils";
import ChatThread from "../features/chat/components/ChatThread";
import ConversationList from "../features/chat/components/ConversationList";
import NewChatDialog from "../features/chat/components/NewChatDialog";

// List on the left, open chat on the right; on phones only one of them shows.
export default function MessagesPage() {
  const { id } = useParams();
  const [newChat, setNewChat] = useState(false);

  return (
    <Page
      fixed
      title={<GradientText>Messages</GradientText>}
      actions={
        <motion.button
          whileTap={{ scale: 0.96 }}
          whileHover={{ y: -1 }}
          onClick={() => setNewChat(true)}
          className="flex h-10 items-center gap-1.5 rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 px-4 text-sm font-medium text-white shadow-lg shadow-fuchsia-500/20"
        >
          <HiPencilSquare className="size-4" />
          <span>
            New<span className="hidden sm:inline"> chat</span>
          </span>
        </motion.button>
      }
    >
      <div className={cn(SPLIT, "h-[calc(100dvh-10.5rem-var(--player-h,0px))] lg:h-full")}>
        <Panel className={cn("lg:col-span-2 lg:flex", id ? "hidden" : "flex")} header={<p className="font-semibold">Chats</p>}>
          <ConversationList activeId={id} onNewChat={() => setNewChat(true)} />
        </Panel>

        <Panel delay={0.1} className={cn("lg:col-span-3 lg:flex", id ? "flex" : "hidden")} bodyClassName="overflow-hidden">
          {id ? (
            <ChatThread
              key={id}
              id={id}
              back={
                <Link
                  to="/messages"
                  aria-label="Back to chats"
                  className="grid size-8 shrink-0 place-items-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
                >
                  <HiArrowLeft className="size-4.5" />
                </Link>
              }
            />
          ) : (
            <div className="grid h-full place-items-center p-6">
              <EmptyState
                size="lg"
                icon={HiOutlineChatBubbleLeftRight}
                title="Your messages"
                text="Pick a chat on the left, or start a new one with a friend."
              />
            </div>
          )}
        </Panel>
      </div>

      <NewChatDialog open={newChat} onClose={() => setNewChat(false)} />
    </Page>
  );
}
