import { useMemo } from "react";
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { errorMessage } from "../../lib/errors";
import { qk } from "../../lib/queryKeys";
import {
  addToPlaylist,
  createPlaylist,
  deletePlaylist,
  getLibrary,
  getLikedKeys,
  getLikedTracks,
  getMembership,
  getPlaylist,
  removeFromPlaylist,
  searchTracks,
  setLiked,
  updatePlaylist,
} from "./api";
import type { Library, TrackRef } from "./types";
import { trackKey, uniqueTracks } from "./utils";

export function useTrackSearch(q: string) {
  const query = useInfiniteQuery({
    queryKey: qk.trackSearch(q),
    queryFn: ({ pageParam }) => searchTracks(q, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextOffset ?? undefined,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });
  const tracks = useMemo(() => uniqueTracks(query.data?.pages.flatMap((p) => p.tracks) ?? []), [query.data]);
  return { ...query, tracks };
}

export const useLibrary = () => useQuery({ queryKey: qk.library, queryFn: getLibrary });

export const usePlaylist = (id: string) => useQuery({ queryKey: qk.playlist(id), queryFn: () => getPlaylist(id) });

export const useLikedTracks = () => useQuery({ queryKey: qk.liked, queryFn: getLikedTracks });

export function useLikedKeys() {
  return useQuery({ queryKey: qk.likedKeys, queryFn: getLikedKeys, select: (keys) => new Set(keys) });
}

export function useMembership(track: TrackRef | null) {
  const key = track ? trackKey(track) : "";
  return useQuery({
    queryKey: qk.membership(key),
    queryFn: () => getMembership(track!),
    enabled: !!track,
    staleTime: 0,
  });
}

export function syncLibrary(qc: QueryClient) {
  return Promise.all(
    [qk.library, qk.playlistAll, qk.liked, qk.likedKeys, qk.membershipAll].map((queryKey) =>
      qc.invalidateQueries({ queryKey }),
    ),
  );
}

function useLibraryMutation<V, R>(fn: (v: V) => Promise<R>, onSuccess?: (r: R, v: V) => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess,
    onError: (e) => toast.error(errorMessage(e)),
    onSettled: () => syncLibrary(qc),
  });
}

export const useCreatePlaylist = () => useLibraryMutation(createPlaylist);
export const useUpdatePlaylist = () => useLibraryMutation(updatePlaylist);
// Card disappears right away instead of waiting for the library refetch.
export function useDeletePlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePlaylist,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: qk.library });
      const prev = qc.getQueryData<Library>(qk.library);
      qc.setQueryData<Library>(qk.library, (lib) => lib && { ...lib, playlists: lib.playlists.filter((p) => p.id !== id) });
      return { prev };
    },
    onSuccess: (_r, id) => {
      qc.removeQueries({ queryKey: qk.playlist(id) });
      toast.success("Playlist deleted");
    },
    onError: (e, _id, ctx) => {
      qc.setQueryData(qk.library, ctx?.prev);
      toast.error(errorMessage(e));
    },
    onSettled: () => syncLibrary(qc),
  });
}
export const useRemoveFromPlaylist = () => useLibraryMutation(removeFromPlaylist);
export const useAddToPlaylist = () => useLibraryMutation(addToPlaylist);

// Optimistic so the heart reacts instantly; rolled back if the request fails.
export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: setLiked,
    onMutate: async ({ track, liked }) => {
      await qc.cancelQueries({ queryKey: qk.likedKeys });
      const prev = qc.getQueryData<string[]>(qk.likedKeys);
      const key = trackKey(track);
      qc.setQueryData<string[]>(qk.likedKeys, (keys = []) =>
        liked ? [...keys, key] : keys.filter((k) => k !== key),
      );
      return { prev };
    },
    onError: (e, _v, ctx) => {
      qc.setQueryData(qk.likedKeys, ctx?.prev);
      toast.error(errorMessage(e));
    },
    onSettled: () => syncLibrary(qc),
  });
}
