import Panel from "../components/common/Panel";
import Page, { GradientText, SPLIT } from "../components/layout/Page";
import CreatePlaylistButton from "../features/music/components/CreatePlaylistButton";
import NowPlayingPanel from "../features/music/components/NowPlaying";
import SongSearch from "../features/music/components/SongSearch";
import { BrowseActions } from "../features/music/components/TrackActions";
import { cn } from "../lib/utils";

export default function SongsPage() {
  return (
    <Page
      fixed
      title={<>Find your <GradientText>sound</GradientText></>}
      subtitle="Search free music, tap to play, save what you love."
      actions={<CreatePlaylistButton />}
    >
      <div className={cn(SPLIT, "lg:h-full")}>
        <Panel delay={0.1} className="lg:col-span-3">
          <SongSearch trailing={(track) => <BrowseActions track={track} />} />
        </Panel>
        <NowPlayingPanel />
      </div>
    </Page>
  );
}
