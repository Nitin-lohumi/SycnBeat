import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineExclamationTriangle,
  HiOutlineHandRaised,
  HiOutlineMusicalNote,
  HiOutlineQueueList,
  HiOutlineUsers,
} from "react-icons/hi2";
import type { IconType } from "react-icons";
import EmptyState from "../components/common/EmptyState";
import Panel from "../components/common/Panel";
import PillTabs from "../components/common/PillTabs";
import { useIsDesktop } from "../hooks/useMediaQuery";
import { cn } from "../lib/utils";
import { useRoom } from "../store/room";
import TrackCover from "../features/music/components/TrackCover";
import AddSongsDialog from "../features/rooms/components/AddSongsDialog";
import ChatPanel from "../features/rooms/components/ChatPanel";
import InviteDialog from "../features/rooms/components/InviteDialog";
import PeoplePanel, { PeopleHeader } from "../features/rooms/components/PeoplePanel";
import QueuePanel, { QueueHeader } from "../features/rooms/components/QueuePanel";
import RequestsPanel, { usePendingRequests } from "../features/rooms/components/RequestsPanel";
import { RoomPlayButton } from "../features/rooms/components/RoomControls";
import RoomSettingsDialog from "../features/rooms/components/RoomSettingsDialog";
import RoomStage from "../features/rooms/components/RoomStage";
import RoomTopBar from "../features/rooms/components/RoomTopBar";

type SideTab = "queue" | "people" | "requests";
type MobileTab = "now" | SideTab | "chat";

export default function RoomPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const status = useRoom((s) => s.status);
  const roomId = useRoom((s) => s.roomId);
  const join = useRoom((s) => s.join);
  const [error, setError] = useState<string | null>(null);
  const wasLive = useRef(false);

  useEffect(() => {
    setError(null);
    wasLive.current = false;
    join(id).catch((e: Error) => setError(e.message));
  }, [id, join]);

  // Kicked, room deleted or left from another tab: go back to the Rooms page.
  useEffect(() => {
    if (status === "live" && roomId === id) wasLive.current = true;
    else if (status === "idle" && wasLive.current) navigate("/rooms", { replace: true });
  }, [status, roomId, id, navigate]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-neutral-950 text-white">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-130 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.2),transparent_65%)]" />
      {error ? (
        <JoinError message={error} />
      ) : status === "live" && roomId === id ? (
        <RoomScreen roomId={id} />
      ) : (
        <Joining />
      )}
    </div>
  );
}

function Joining() {
  return (
    <div className="grid flex-1 place-items-center">
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ scale: [1, 1.12, 1], rotate: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
          className="grid size-16 place-items-center rounded-2xl bg-linear-to-br from-violet-500 to-fuchsia-500 shadow-2xl shadow-fuchsia-500/30"
        >
          <HiOutlineMusicalNote className="size-8" />
        </motion.div>
        <p className="text-sm text-white/60">Tuning in…</p>
      </div>
    </div>
  );
}

function JoinError({ message }: { message: string }) {
  return (
    <div className="grid flex-1 place-items-center p-6">
      <EmptyState
        size="lg"
        icon={HiOutlineExclamationTriangle}
        title="Couldn't join this room"
        text={message}
        action={
          <Link to="/rooms" replace className="rounded-full bg-white/8 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/12">
            Back to rooms
          </Link>
        }
      />
    </div>
  );
}

function RoomScreen({ roomId }: { roomId: string }) {
  const isDesktop = useIsDesktop();
  const [dialog, setDialog] = useState<"add" | "invite" | "settings" | null>(null);
  const close = () => setDialog(null);
  const open = {
    add: () => setDialog("add"),
    invite: () => setDialog("invite"),
    settings: () => setDialog("settings"),
  };

  return (
    <>
      <RoomTopBar onInvite={open.invite} onSettings={open.settings} />
      {isDesktop ? <DesktopLayout onAdd={open.add} onInvite={open.invite} /> : <MobileLayout onAdd={open.add} onInvite={open.invite} />}
      <AddSongsDialog open={dialog === "add"} onClose={close} />
      <InviteDialog roomId={roomId} open={dialog === "invite"} onClose={close} />
      <RoomSettingsDialog open={dialog === "settings"} onClose={close} />
    </>
  );
}

type LayoutProps = { onAdd: () => void; onInvite: () => void };

function useSideTabs() {
  const pending = usePendingRequests().length;
  return [
    { id: "queue", label: "Queue", icon: HiOutlineQueueList },
    { id: "people", label: "People", icon: HiOutlineUsers },
    { id: "requests", label: "Requests", icon: HiOutlineHandRaised, count: pending, highlight: pending > 0 },
  ] as const;
}

function SideContent({ tab, onAdd }: { tab: SideTab; onAdd: () => void }) {
  if (tab === "queue") return <QueuePanel onAdd={onAdd} />;
  if (tab === "people") return <PeoplePanel />;
  return <RequestsPanel />;
}

function SideHeader({ tab, onAdd, onInvite }: { tab: SideTab } & LayoutProps): ReactNode {
  if (tab === "queue") return <QueueHeader onAdd={onAdd} />;
  if (tab === "people") return <PeopleHeader onInvite={onInvite} />;
  return <p className="font-semibold">Requests</p>;
}

function DesktopLayout({ onAdd, onInvite }: LayoutProps) {
  const [tab, setTab] = useState<SideTab>("queue");
  const tabs = useSideTabs();

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(20rem,24rem)_minmax(0,1fr)_minmax(19rem,24rem)] gap-4 p-4 xl:gap-5 xl:p-5">
      <Panel header={<PillTabs layoutId="room-side-tab" tabs={tabs} value={tab} onChange={setTab} />} bodyClassName="flex flex-col">
        <div className="flex h-12 shrink-0 items-center gap-3 border-b border-white/5 px-4">
          <SideHeader tab={tab} onAdd={onAdd} onInvite={onInvite} />
        </div>
        <SideContent tab={tab} onAdd={onAdd} />
      </Panel>

      <RoomStage onAddSongs={onAdd} />

      <Panel
        delay={0.1}
        bodyClassName="overflow-hidden"
        header={
          <p className="flex items-center gap-2 font-semibold">
            <span className="grid size-8 place-items-center rounded-full bg-violet-500/15 text-violet-300">
              <HiOutlineChatBubbleLeftRight className="size-4" />
            </span>
            Room chat
          </p>
        }
      >
        <ChatPanel />
      </Panel>
    </div>
  );
}

function MobileLayout({ onAdd, onInvite }: LayoutProps) {
  const [tab, setTab] = useState<MobileTab>("now");
  const unread = useRoom((s) => s.unread);
  const pending = usePendingRequests().length;

  const tabs: { id: MobileTab; label: string; icon: IconType; badge?: number }[] = [
    { id: "now", label: "Now", icon: HiOutlineMusicalNote },
    { id: "queue", label: "Queue", icon: HiOutlineQueueList },
    { id: "chat", label: "Chat", icon: HiOutlineChatBubbleLeftRight, badge: unread },
    { id: "people", label: "People", icon: HiOutlineUsers },
    { id: "requests", label: "Requests", icon: HiOutlineHandRaised, badge: pending },
  ];

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-2 p-2.5">
        {tab !== "now" && <NowStrip onOpen={() => setTab("now")} />}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            {tab === "now" ? (
              <RoomStage onAddSongs={onAdd} className="flex-1" />
            ) : tab === "chat" ? (
              <Panel className="flex-1" bodyClassName="overflow-hidden">
                <ChatPanel />
              </Panel>
            ) : (
              <Panel
                className="flex-1"
                bodyClassName="flex flex-col"
                header={<SideHeader tab={tab} onAdd={onAdd} onInvite={onInvite} />}
              >
                <SideContent tab={tab} onAdd={onAdd} />
              </Panel>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <nav className="flex shrink-0 border-t border-white/10 bg-black/60 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className="relative flex h-15 flex-1 flex-col items-center justify-center gap-1 text-[10px]">
              {active && <motion.span layoutId="room-mobile-tab" className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-linear-to-r from-violet-400 to-fuchsia-400" />}
              <span className="relative">
                <t.icon className={cn("size-5.5 transition-colors", active ? "text-white" : "text-white/40")} />
                {!!t.badge && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-4 rounded-full bg-fuchsia-500 px-1 text-center text-[9px] leading-4 font-semibold text-white">
                    {t.badge > 9 ? "9+" : t.badge}
                  </span>
                )}
              </span>
              <span className={active ? "text-white" : "text-white/40"}>{t.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

function NowStrip({ onOpen }: { onOpen: () => void }) {
  const track = useRoom((s) => s.playback?.track ?? null);
  if (!track) return null;
  return (
    <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/4 p-2">
      <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <TrackCover src={track.thumbnailUrl} className="size-10 rounded-lg" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{track.title}</span>
          <span className="block truncate text-xs text-white/40">{track.artist ?? "Unknown artist"}</span>
        </span>
      </button>
      <RoomPlayButton size="sm" />
    </div>
  );
}
