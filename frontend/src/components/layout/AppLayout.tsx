import type { CSSProperties } from "react";
import { MotionConfig } from "framer-motion";
import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import AddToPlaylistDialog from "../../features/music/components/AddToPlaylistDialog";
import FullPlayer from "../../features/music/components/FullPlayer";
import MiniPlayer, { useMiniPlayerVisible } from "../../features/music/components/MiniPlayer";
import { useChatRealtime } from "../../features/chat/useChatRealtime";
import { useRealtime } from "../../features/realtime/useRealtime";
import LeaveRoomPrompt from "../../features/rooms/components/LeaveRoomPrompt";
import MiniRoomCard, { useMiniRoomVisible } from "../../features/rooms/components/MiniRoomCard";
import { useRoomRealtime } from "../../features/rooms/useRoomRealtime";
import Header from "./Header";

export default function AppLayout() {
  useRoomRealtime();
  useChatRealtime();
  useRealtime();
  const playerVisible = useMiniPlayerVisible();
  const roomCardVisible = useMiniRoomVisible();
  const miniVisible = playerVisible || roomCardVisible;
  // Pages read --player-h so content never hides behind the mini player.
  const playerVars = { "--player-h": miniVisible ? "5.5rem" : "0px" } as CSSProperties;

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-dvh bg-black text-white" style={playerVars}>
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 h-130 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.18),transparent_65%)]"
        />
        <Header />
        <main className="relative pb-(--player-h)">
          <Outlet />
        </main>
        <MiniPlayer />
        <FullPlayer />
        <AddToPlaylistDialog />
        <MiniRoomCard />
        <LeaveRoomPrompt />
      </div>
      <Toaster
        position="bottom-right"
        theme="dark"
        closeButton
        gap={10}
        offset={{ bottom: miniVisible ? 104 : 24, top: 76 }}
        mobileOffset={{ bottom: miniVisible ? 96 : 16, top: 72 }}
        toastOptions={{
          classNames: {
            toast: "rounded-2xl! border-white/10! bg-neutral-950/95! pr-10! backdrop-blur-xl!",
            // Close button inside the toast's top-right corner instead of hanging off the left.
            closeButton:
              "left-auto! right-2! top-2! transform-none! size-6! border-0! bg-transparent! text-white/40! hover:bg-white/10! hover:text-white!",
          },
        }}
      />
    </MotionConfig>
  );
}
