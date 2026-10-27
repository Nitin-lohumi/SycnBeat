import { MotionConfig } from "framer-motion";
import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import { useRealtime } from "../../features/realtime/useRealtime";
import Header from "./Header";

export default function AppLayout() {
  useRealtime();

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-dvh bg-black text-white">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.18),transparent_65%)]"
        />
        <Header />
        <main className="relative">
          <Outlet />
        </main>
      </div>
      <Toaster
        position="bottom-right"
        theme="dark"
        gap={10}
        toastOptions={{
          classNames: {
            toast: "rounded-2xl! border-white/10! bg-neutral-950/95! backdrop-blur-xl!",
          },
        }}
      />
    </MotionConfig>
  );
}
