import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { roomToast } from "./toast";
import { errorMessage } from "../../lib/errors";
import { qk } from "../../lib/queryKeys";
import {
  acceptInvite,
  addToQueue,
  createRoom,
  declineInvite,
  deleteRoom,
  getInvitable,
  getQueue,
  getRoom,
  getRooms,
  inviteFriends,
  kickMember,
  removeFromQueue,
  removeMembership,
  reorderQueue,
  setAbilities,
  updateRoom,
} from "./api";
import type { QueueTrack, RoomsList } from "./types";
import { trackKey } from "../music/utils";

export const useRooms = () => useQuery({ queryKey: qk.rooms, queryFn: getRooms });

export const useRoomDetail = (id: string | null) =>
  useQuery({ queryKey: qk.room(id ?? ""), queryFn: () => getRoom(id!), enabled: !!id });

export const useRoomQueue = (id: string | null) =>
  useQuery({ queryKey: qk.roomQueue(id ?? ""), queryFn: () => getQueue(id!), enabled: !!id });

export const useInvitable = (id: string, enabled: boolean) =>
  useQuery({ queryKey: qk.roomInvitable(id), queryFn: () => getInvitable(id), enabled, staleTime: 0 });

export function syncRooms(qc: QueryClient, roomId?: string | null) {
  const keys = [qk.rooms, ...(roomId ? [qk.room(roomId), qk.roomInvitable(roomId)] : [])];
  return Promise.all(keys.map((queryKey) => qc.invalidateQueries({ queryKey })));
}

function useRoomMutation<V, R>(fn: (v: V) => Promise<R>, roomOf?: (v: V) => string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onError: (e) => roomToast.error(errorMessage(e)),
    onSettled: (_r, _e, v) => syncRooms(qc, roomOf?.(v)),
  });
}

export const useCreateRoom = () => useRoomMutation(createRoom);
export const useUpdateRoom = () => useRoomMutation(updateRoom, (v) => v.id);
export const useInviteFriends = () => useRoomMutation(inviteFriends, (v) => v.id);
export const useSetAbilities = () => useRoomMutation(setAbilities, (v) => v.id);
export const useKickMember = () => useRoomMutation(kickMember, (v) => v.id);
export const useAcceptInvite = () => useRoomMutation(acceptInvite);
export const useDeclineInvite = () => useRoomMutation(declineInvite);

// Cards disappear right away, like playlists.
function useOptimisticRemove(fn: (id: string) => Promise<void>, success: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: qk.rooms });
      const prev = qc.getQueryData<RoomsList>(qk.rooms);
      qc.setQueryData<RoomsList>(
        qk.rooms,
        (r) => r && { ...r, owned: r.owned.filter((x) => x.id !== id), joined: r.joined.filter((x) => x.id !== id) },
      );
      return { prev };
    },
    onSuccess: () => roomToast.success(success),
    onError: (e, _id, ctx) => {
      qc.setQueryData(qk.rooms, ctx?.prev);
      roomToast.error(errorMessage(e));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.rooms }),
  });
}

export const useDeleteRoom = () => useOptimisticRemove(deleteRoom, "Room deleted");
export const useRemoveMembership = () => useOptimisticRemove(removeMembership, "Room removed");

function useQueueMutation<V extends { id: string }, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onError: (e) => roomToast.error(errorMessage(e)),
    onSettled: (_r, _e, v) => qc.invalidateQueries({ queryKey: qk.roomQueue(v.id) }),
  });
}

export const useAddToQueue = () => useQueueMutation(addToQueue);
export const useReorderQueue = () => useQueueMutation(reorderQueue);

export function useRemoveFromQueue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removeFromQueue,
    onMutate: ({ id, track }) => {
      const prev = qc.getQueryData<QueueTrack[]>(qk.roomQueue(id));
      qc.setQueryData<QueueTrack[]>(qk.roomQueue(id), (list) => list?.filter((t) => trackKey(t) !== trackKey(track)));
      return { prev };
    },
    onError: (e, v, ctx) => {
      qc.setQueryData(qk.roomQueue(v.id), ctx?.prev);
      roomToast.error(errorMessage(e));
    },
    onSettled: (_r, _e, v) => qc.invalidateQueries({ queryKey: qk.roomQueue(v.id) }),
  });
}
