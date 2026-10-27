import type { CSSProperties } from "react";
import { MotionConfig } from "framer-motion";
import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import AddToPlaylistDialog from "../../features/music/components/AddToPlaylistDialog";
import FullPlayer from "../../features/music/components/FullPlayer";
import MiniPlayer, { useMiniPlayerVisible } from "../../features/music/components/MiniPlayer";
import { useRealtime } from "../../features/realtime/useRealtime";
import Header from "./Header";

export default function AppLayout() {
  useRealtime();
  const miniVisible = useMiniPlayerVisible();
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
      </div>
      <Toaster
        position="bottom-right"
        theme="dark"
        gap={10}
        offset={{ bottom: miniVisible ? 104 : 24 }}
        mobileOffset={{ bottom: miniVisible ? 96 : 16 }}
        toastOptions={{
          classNames: {
            toast: "rounded-2xl! border-white/10! bg-neutral-950/95! backdrop-blur-xl!",
          },
        }}
      />
    </MotionConfig>
  );
}
