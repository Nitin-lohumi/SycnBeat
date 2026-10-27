import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { errorMessage } from "../../lib/errors";
import { qk } from "../../lib/queryKeys";
import {
  acceptFriendRequest,
  deleteFriendRequest,
  getFriendRequests,
  getFriends,
  searchUsers,
  sendFriendRequest,
  unfriend,
} from "./api";
import type { SearchUser } from "./types";

export function useFriends() {
  return useQuery({ queryKey: qk.friends, queryFn: getFriends });
}

export function useFriendRequests() {
  return useQuery({ queryKey: qk.friendRequests, queryFn: getFriendRequests, staleTime: 0 });
}

export function useUserSearch(q: string) {
  return useQuery({
    queryKey: qk.userSearch(q),
    queryFn: () => searchUsers(q),
    placeholderData: keepPreviousData,
  });
}

// Refetch every friend-related query (even ones not on screen) and wait for them.
export function syncSocial(qc: QueryClient, { search = true } = {}) {
  return Promise.all([
    ...[qk.friendRequests, qk.friends, qk.counts].map((queryKey) =>
      qc.invalidateQueries({ queryKey, refetchType: "all" }),
    ),
    search && qc.invalidateQueries({ queryKey: qk.userSearchAll }),
  ]);
}

function patchSearchUser(qc: QueryClient, userId: string, patch: Partial<SearchUser>) {
  qc.setQueriesData<SearchUser[]>({ queryKey: qk.userSearchAll }, (users) =>
    users?.map((u) => (u.id === userId ? { ...u, ...patch } : u)),
  );
}

function useSocialMutation<V>(fn: (v: V) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onError: (e) => toast.error(errorMessage(e)),
    onSettled: () => syncSocial(qc),
  });
}

export const useAcceptFriendRequest = () => useSocialMutation(acceptFriendRequest);
export const useDeleteFriendRequest = () => useSocialMutation(deleteFriendRequest);
export const useUnfriend = () => useSocialMutation(unfriend);

export function useSendFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: (res, userId) => {
      patchSearchUser(qc, userId, res);
      if (res.status === "FRIENDS") toast.success("You're now friends 🎉");
    },
    onError: (e) => toast.error(errorMessage(e)),
    // Search is patched instead of refetched, otherwise the user vanishes from suggestions.
    onSettled: () => syncSocial(qc, { search: false }),
  });
}
