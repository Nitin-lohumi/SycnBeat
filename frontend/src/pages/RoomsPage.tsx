import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { HiOutlineRadio, HiPlus } from "react-icons/hi2";
import EmptyState from "../components/common/EmptyState";
import ErrorState from "../components/common/ErrorState";
import { Skeleton } from "../components/common/Skeleton";
import Page, { GradientText } from "../components/layout/Page";
import RoomCard from "../features/rooms/components/RoomCard";
import RoomFormDialog from "../features/rooms/components/RoomFormDialog";
import { useCreateRoom, useRooms } from "../features/rooms/hooks";
import type { RoomCard as Room } from "../features/rooms/types";
import { cn } from "../lib/utils";
import { useRoom } from "../store/room";

const GRID = "grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5";

export default function RoomsPage() {
  const rooms = useRooms();
  const create = useCreateRoom();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const currentRoomId = useRoom((s) => (s.status === "live" ? s.roomId : null));

  return (
    <Page
      title={<>Listen <GradientText>together</GradientText></>}
      subtitle="Start a room, invite friends and hear every beat at the same time."
      actions={
        <motion.button
          whileTap={{ scale: 0.96 }}
          whileHover={{ y: -1 }}
          onClick={() => setCreating(true)}
          className="flex h-10 items-center gap-1.5 rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 px-4 text-sm font-medium text-white shadow-lg shadow-fuchsia-500/20"
        >
          <HiPlus className="size-4" />
          <span>
            Create<span className="hidden sm:inline"> room</span>
          </span>
        </motion.button>
      }
    >
      {rooms.isPending ? (
        <div className={GRID}>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-white/5">
              <Skeleton className="h-28 w-full rounded-none" />
              <div className="space-y-2 p-3.5">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-2.5 w-1/3" />
                <Skeleton className="mt-4 h-10 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : rooms.isError ? (
        <ErrorState onRetry={() => rooms.refetch()} />
      ) : rooms.data.owned.length === 0 && rooms.data.joined.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10">
          <EmptyState
            size="lg"
            icon={HiOutlineRadio}
            title="No rooms yet"
            text="Create a room, add some songs and invite your friends. Rooms friends invite you to show up here too."
            action={
              <button
                onClick={() => setCreating(true)}
                className="rounded-full bg-white/8 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/12"
              >
                Create your first room
              </button>
            }
          />
        </div>
      ) : (
        <RoomSections owned={rooms.data.owned} joined={rooms.data.joined} currentRoomId={currentRoomId} />
      )}

      <RoomFormDialog
        open={creating}
        title="Create a room"
        submitLabel="Create room"
        saving={create.isPending}
        onClose={() => setCreating(false)}
        onSubmit={(values) =>
          create.mutate(values, {
            onSuccess: (room) => {
              setCreating(false);
              navigate(`/rooms/${room.id}`);
            },
          })
        }
      />
    </Page>
  );
}

// One list takes the full width; with both, My rooms gets 3/5 and Joined 2/5 on desktop.
function RoomSections({ owned, joined, currentRoomId }: { owned: Room[]; joined: Room[]; currentRoomId: string | null }) {
  const both = owned.length > 0 && joined.length > 0;

  return (
    <div className={cn("grid gap-8", both && "lg:grid-cols-5 lg:gap-6")}>
      {owned.length > 0 && (
        <Section
          title="My rooms"
          rooms={owned}
          owned
          currentRoomId={currentRoomId}
          className={both ? "lg:col-span-3" : undefined}
          grid={both ? "grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-3" : GRID}
        />
      )}
      {joined.length > 0 && (
        <Section
          title="Joined rooms"
          rooms={joined}
          currentRoomId={currentRoomId}
          className={both ? "lg:col-span-2" : undefined}
          grid={both ? "grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2" : GRID}
        />
      )}
    </div>
  );
}

type SectionProps = {
  title: string;
  rooms: Room[];
  owned?: boolean;
  currentRoomId: string | null;
  className?: string;
  grid: string;
};

function Section({ title, rooms, owned = false, currentRoomId, className, grid }: SectionProps) {
  return (
    <section className={cn("min-w-0", className)}>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-medium tracking-wider text-white/50 uppercase">
        {title}
        <span className="rounded-full bg-white/8 px-2 py-0.5 text-[11px] text-white/60">{rooms.length}</span>
      </h2>
      <div className={grid}>
        <AnimatePresence initial={false}>
          {rooms.map((room, i) => (
            <RoomCard key={room.id} room={room} owned={owned} current={currentRoomId === room.id} index={i} />
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
