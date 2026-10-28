import { api } from "../../api/axios";
import type { TrackRef } from "../music/types";
import type { Ability, InvitableFriend, QueueTrack, RoomDetail, RoomsList } from "./types";

const refPath = (ref: TrackRef) => `${ref.source}/${encodeURIComponent(ref.sourceId)}`;

export async function getRooms() {
  const { data } = await api.get<RoomsList>("/api/rooms");
  return data;
}

export async function getRoom(id: string) {
  const { data } = await api.get<{ room: RoomDetail }>(`/api/rooms/${id}`);
  return data.room;
}

export async function createRoom(input: { name: string; description?: string | null }) {
  const { data } = await api.post<{ room: RoomDetail }>("/api/rooms", input);
  return data.room;
}

export async function updateRoom({ id, ...input }: { id: string; name?: string; description?: string | null }) {
  const { data } = await api.patch<{ room: RoomDetail }>(`/api/rooms/${id}`, input);
  return data.room;
}

export async function deleteRoom(id: string) {
  await api.delete(`/api/rooms/${id}`);
}

export async function getInvitable(id: string) {
  const { data } = await api.get<{ friends: InvitableFriend[] }>(`/api/rooms/${id}/invitable`);
  return data.friends;
}

export async function inviteFriends({ id, userIds }: { id: string; userIds: string[] }) {
  const { data } = await api.post<{ invited: number }>(`/api/rooms/${id}/invites`, { userIds });
  return data.invited;
}

export async function acceptInvite(id: string) {
  const { data } = await api.post<{ roomId: string }>(`/api/rooms/${id}/invite/accept`);
  return data.roomId;
}

export async function declineInvite(id: string) {
  await api.post(`/api/rooms/${id}/invite/decline`);
}

export async function removeMembership(id: string) {
  await api.delete(`/api/rooms/${id}/membership`);
}

export async function setAbilities({ id, userId, ...data }: { id: string; userId: string } & Partial<Record<Ability, boolean>>) {
  await api.patch(`/api/rooms/${id}/members/${userId}`, data);
}

export async function kickMember({ id, userId }: { id: string; userId: string }) {
  await api.delete(`/api/rooms/${id}/members/${userId}`);
}

export async function getQueue(id: string) {
  const { data } = await api.get<{ tracks: QueueTrack[] }>(`/api/rooms/${id}/tracks`);
  return data.tracks;
}

export async function addToQueue({ id, ...input }: { id: string } & ({ tracks: TrackRef[] } | { playlistId: string })) {
  const { data } = await api.post<{ added: number }>(`/api/rooms/${id}/tracks`, input);
  return data.added;
}

export async function reorderQueue({ id, tracks }: { id: string; tracks: TrackRef[] }) {
  await api.put(`/api/rooms/${id}/tracks/order`, { tracks });
}

export async function removeFromQueue({ id, track }: { id: string; track: TrackRef }) {
  await api.delete(`/api/rooms/${id}/tracks/${refPath(track)}`);
}
