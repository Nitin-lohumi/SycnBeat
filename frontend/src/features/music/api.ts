import { api } from "../../api/axios";
import type { Library, PlaylistDetail, PlaylistInput, Track, TrackPage, TrackRef } from "./types";

const refPath = (ref: TrackRef) => `${ref.source}/${encodeURIComponent(ref.sourceId)}`;

export async function searchTracks(q: string, offset: number) {
  const { data } = await api.get<TrackPage>("/api/music/search", { params: { q, offset, limit: 20 } });
  return data;
}

export async function getLibrary() {
  const { data } = await api.get<Library>("/api/playlists");
  return data;
}

export async function getPlaylist(id: string) {
  const { data } = await api.get<{ playlist: PlaylistDetail }>(`/api/playlists/${id}`);
  return data.playlist;
}

export async function getMembership(ref: TrackRef) {
  const { data } = await api.get<{ playlistIds: string[] }>("/api/playlists/membership", { params: ref });
  return data.playlistIds;
}

export async function createPlaylist(input: PlaylistInput) {
  const { data } = await api.post<{ playlist: PlaylistDetail }>("/api/playlists", input);
  return data.playlist;
}

export async function updatePlaylist({ id, ...input }: PlaylistInput & { id: string }) {
  const { data } = await api.patch<{ playlist: PlaylistDetail }>(`/api/playlists/${id}`, input);
  return data.playlist;
}

export async function deletePlaylist(id: string) {
  await api.delete(`/api/playlists/${id}`);
}

export async function addToPlaylist({ playlistId, track }: { playlistId: string; track: TrackRef }) {
  await api.post(`/api/playlists/${playlistId}/tracks`, { source: track.source, sourceId: track.sourceId });
}

export async function removeFromPlaylist({ playlistId, track }: { playlistId: string; track: TrackRef }) {
  await api.delete(`/api/playlists/${playlistId}/tracks/${refPath(track)}`);
}

export async function getLikedTracks() {
  const { data } = await api.get<{ tracks: Track[] }>("/api/likes");
  return data.tracks;
}

export async function getLikedKeys() {
  const { data } = await api.get<{ keys: string[] }>("/api/likes/keys");
  return data.keys;
}

export async function setLiked({ track, liked }: { track: TrackRef; liked: boolean }) {
  if (liked) await api.put(`/api/likes/${refPath(track)}`);
  else await api.delete(`/api/likes/${refPath(track)}`);
}
