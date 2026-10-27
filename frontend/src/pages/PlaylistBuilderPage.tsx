import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import ErrorState from "../components/common/ErrorState";
import Spinner from "../components/common/Spinner";
import PlaylistBuilder, { type Draft } from "../features/music/components/PlaylistBuilder";
import { useCreatePlaylist, usePlaylist, useUpdatePlaylist } from "../features/music/hooks";
import { toRef } from "../features/music/utils";

const toInput = (d: Draft) => ({
  name: d.name,
  description: d.description || null,
  tracks: d.tracks.map(toRef),
});

export function NewPlaylistPage() {
  const create = useCreatePlaylist();
  const navigate = useNavigate();

  return (
    <PlaylistBuilder
      mode="create"
      cancelTo="/playlists"
      saving={create.isPending}
      onSave={(draft) =>
        create.mutate(toInput(draft), {
          onSuccess: (p) => {
            toast.success(`"${p.name}" created`);
            navigate(`/playlists/${p.id}`, { replace: true });
          },
        })
      }
    />
  );
}

export function EditPlaylistPage() {
  const { id = "" } = useParams();
  const playlist = usePlaylist(id);
  const update = useUpdatePlaylist();
  const navigate = useNavigate();

  if (playlist.isPending) {
    return (
      <div className="grid place-items-center py-32 text-white/50">
        <Spinner className="size-6" />
      </div>
    );
  }
  if (playlist.isError) return <div className="py-20"><ErrorState onRetry={() => playlist.refetch()} /></div>;

  const { name, description, tracks } = playlist.data;

  return (
    <PlaylistBuilder
      key={id}
      mode="edit"
      cancelTo={`/playlists/${id}`}
      initial={{ name, description: description ?? "", tracks }}
      saving={update.isPending}
      onSave={(draft) =>
        update.mutate(
          { id, ...toInput(draft) },
          {
            onSuccess: () => {
              toast.success("Playlist saved");
              navigate(`/playlists/${id}`, { replace: true });
            },
          },
        )
      }
    />
  );
}
