import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, Reorder, useDragControls } from "framer-motion";
import { Link } from "react-router-dom";
import { HiBars2, HiOutlineMagnifyingGlass, HiOutlineQueueList } from "react-icons/hi2";
import EmptyState from "../../../components/common/EmptyState";
import Panel from "../../../components/common/Panel";
import PillTabs from "../../../components/common/PillTabs";
import Spinner from "../../../components/common/Spinner";
import Page, { GradientText, SPLIT } from "../../../components/layout/Page";
import { cn } from "../../../lib/utils";
import type { Track } from "../types";
import { songCount, totalDuration, trackKey } from "../utils";
import PlaylistCover from "./PlaylistCover";
import SongSearch from "./SongSearch";
import { RemoveTrackButton, ToggleInDraftButton } from "./TrackActions";
import TrackRow from "./TrackRow";

export interface Draft {
  name: string;
  description: string;
  tracks: Track[];
}

type Props = {
  mode: "create" | "edit";
  initial?: Draft;
  saving: boolean;
  cancelTo: string;
  onSave: (draft: Draft) => void;
};

type MobileTab = "draft" | "search";

export default function PlaylistBuilder({ mode, initial, saving, cancelTo, onSave }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [tracks, setTracks] = useState<Track[]>(initial?.tracks ?? []);
  const [tab, setTab] = useState<MobileTab>("search");

  const keys = useMemo(() => new Set(tracks.map(trackKey)), [tracks]);
  const covers = tracks.flatMap((t) => (t.thumbnailUrl ? [t.thumbnailUrl] : [])).slice(0, 4);

  const toggle = (track: Track) =>
    setTracks((list) =>
      keys.has(trackKey(track)) ? list.filter((t) => trackKey(t) !== trackKey(track)) : [...list, track],
    );
  const remove = (track: Track) => setTracks((list) => list.filter((t) => t !== track));

  const [nameError, setNameError] = useState(false);
  const [shake, setShake] = useState(0);
  const nameRef = useRef<HTMLInputElement>(null);

  const save = () => {
    if (!name.trim()) {
      setNameError(true);
      setShake((n) => n + 1);
      setTab("draft");
      setTimeout(() => nameRef.current?.focus(), 50);
      return;
    }
    onSave({ name: name.trim(), description: description.trim(), tracks });
  };

  return (
    <Page
      fixed
      back={cancelTo}
      title={mode === "create" ? <>New <GradientText>playlist</GradientText></> : <>Edit <GradientText>playlist</GradientText></>}
      subtitle="Search on one side, build your list on the other."
      actions={
        <>
          <Link to={cancelTo} className="rounded-full px-4 py-2 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white">
            Cancel
          </Link>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={save}
            disabled={saving}
            className="flex h-10 min-w-24 items-center justify-center rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 px-5 text-sm font-medium text-white shadow-lg shadow-fuchsia-500/20 disabled:opacity-60"
          >
            {saving ? <Spinner className="size-4" /> : "Save"}
          </motion.button>
        </>
      }
    >
      <PillTabs
        layoutId="builder-tab"
        value={tab}
        onChange={setTab}
        className="mb-3 w-fit lg:hidden"
        tabs={[
          { id: "draft", label: "Playlist", icon: HiOutlineQueueList, count: tracks.length },
          { id: "search", label: "Add songs", icon: HiOutlineMagnifyingGlass },
        ]}
      />

      <div className={cn(SPLIT, "h-[calc(100dvh-15rem-var(--player-h,0px))] lg:h-full")}>
        <Panel
          className={cn("lg:col-span-2 lg:flex", tab === "draft" ? "flex" : "hidden")}
          header={
            <>
              <p className="font-semibold">Your playlist</p>
              <span className="ml-auto text-xs text-white/40">
                {songCount(tracks.length)}
                {tracks.length > 0 && ` · ${totalDuration(tracks)}`}
              </span>
            </>
          }
        >
          <div className="flex gap-4 p-4">
            <PlaylistCover covers={covers} className="size-24 sm:size-28" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <motion.div
                key={shake}
                animate={shake ? { x: [0, -8, 8, -5, 5, 0] } : undefined}
                transition={{ duration: 0.35 }}
              >
                <input
                  ref={nameRef}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (e.target.value.trim()) setNameError(false);
                  }}
                  maxLength={60}
                  placeholder="Playlist name *"
                  aria-invalid={nameError}
                  className={cn(
                    "w-full border-b bg-transparent pb-1.5 text-lg font-semibold outline-none placeholder:text-white/25",
                    nameError ? "border-red-500/70" : "border-white/10 focus:border-violet-500/60",
                  )}
                />
                {nameError && <p className="mt-1 text-xs text-red-400">Give your playlist a name</p>}
              </motion.div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={300}
                rows={2}
                placeholder="Add a description (optional)"
                className="w-full resize-none rounded-xl bg-white/4 px-3 py-2 text-sm outline-none placeholder:text-white/25 focus:bg-white/6"
              />
            </div>
          </div>

          <div className="px-1.5 pb-3 sm:px-2.5">
            {tracks.length === 0 ? (
              <EmptyState
                icon={HiOutlineQueueList}
                title="No songs yet"
                text="Search and tap Add to drop songs in here."
              />
            ) : (
              <Reorder.Group axis="y" values={tracks} onReorder={setTracks}>
                <AnimatePresence initial={false}>
                  {tracks.map((track, i) => (
                    <DraftItem key={trackKey(track)} track={track} index={i} onRemove={() => remove(track)} />
                  ))}
                </AnimatePresence>
              </Reorder.Group>
            )}
          </div>
        </Panel>

        <Panel
          delay={0.1}
          className={cn("lg:col-span-3 lg:flex", tab === "search" ? "flex" : "hidden")}
          header={
            <p className="flex items-center gap-2 font-semibold">
              <span className="grid size-8 place-items-center rounded-full bg-violet-500/15 text-violet-300">
                <HiOutlineMagnifyingGlass className="size-4" />
              </span>
              Add songs
            </p>
          }
        >
          <SongSearch
            trailing={(track) => <ToggleInDraftButton added={keys.has(trackKey(track))} onToggle={() => toggle(track)} />}
          />
        </Panel>
      </div>
    </Page>
  );
}

function DraftItem({ track, index, onRemove }: { track: Track; index: number; onRemove: () => void }) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={track}
      dragListener={false}
      dragControls={controls}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0, x: 24 }}
      whileDrag={{ scale: 1.02, boxShadow: "0 12px 30px rgba(0,0,0,0.5)" }}
      className="relative rounded-xl bg-neutral-950"
    >
      <TrackRow
        track={track}
        index={index}
        showIndex
        leading={
          <button
            onPointerDown={(e) => controls.start(e)}
            aria-label="Drag to reorder"
            className="grid size-7 shrink-0 cursor-grab touch-none place-items-center rounded-md text-white/30 hover:text-white active:cursor-grabbing"
          >
            <HiBars2 className="size-4.5" />
          </button>
        }
        trailing={<RemoveTrackButton onRemove={onRemove} />}
      />
    </Reorder.Item>
  );
}
