import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { errorMessage } from "../../lib/errors";
import { qk } from "../../lib/queryKeys";
import type { PublicUser } from "../../types/user";
import type { Counts } from "../notifications/types";
import {
  acceptFriendRequest,
  deleteFriendRequest,
  getFriendRequests,
  getFriends,
  searchUsers,
  sendFriendRequest,
  unfriend,
} from "./api";
import type { Friend, FriendRequests, SearchUser } from "./types";

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

// Snapshot caches, apply optimistic changes, and return a rollback.
async function optimistic(qc: QueryClient, keys: QueryKey[], apply: () => void) {
  await Promise.all(keys.map((queryKey) => qc.cancelQueries({ queryKey })));
  const snapshot = keys.flatMap((queryKey) => qc.getQueriesData({ queryKey }));
  apply();
  return () => snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
}

function patchSearchUser(qc: QueryClient, userId: string, patch: Partial<SearchUser>) {
  qc.setQueriesData<SearchUser[]>({ queryKey: qk.userSearchAll }, (users) =>
    users?.map((u) => (u.id === userId ? { ...u, ...patch } : u)),
  );
}

function removeRequest(qc: QueryClient, requestId: string) {
  qc.setQueryData<FriendRequests>(qk.friendRequests, (r) =>
    r && {
      incoming: r.incoming.filter((x) => x.id !== requestId),
      outgoing: r.outgoing.filter((x) => x.id !== requestId),
    },
  );
}

function decrementRequestCount(qc: QueryClient) {
  qc.setQueryData<Counts>(qk.counts, (c) =>
    c && { ...c, friendRequests: Math.max(0, c.friendRequests - 1) },
  );
}

const touched = [qk.friendRequests, qk.userSearchAll, qk.counts, qk.friends];

function invalidateSocial(qc: QueryClient, keys: QueryKey[] = touched) {
  for (const queryKey of keys) qc.invalidateQueries({ queryKey });
}

export function useSendFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => sendFriendRequest(userId),
    onMutate: async (userId) => ({
      rollback: await optimistic(qc, touched, () => patchSearchUser(qc, userId, { status: "OUTGOING" })),
    }),
    onSuccess: (res, userId) => {
      patchSearchUser(qc, userId, res);
      if (res.status === "FRIENDS") toast.success("You're now friends 🎉");
    },
    onError: (e, _v, ctx) => {
      ctx?.rollback();
      toast.error(errorMessage(e));
    },
    // Skip refetching search, otherwise the user vanishes from suggestions.
    onSettled: () => invalidateSocial(qc, [qk.friendRequests, qk.friends, qk.counts]),
  });
}

type RequestVars = { requestId: string; userId: string };

export function useAcceptFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId }: RequestVars & { user: PublicUser }) => acceptFriendRequest(requestId),
    onMutate: async ({ requestId, userId, user }) => ({
      rollback: await optimistic(qc, touched, () => {
        removeRequest(qc, requestId);
        decrementRequestCount(qc);
        patchSearchUser(qc, userId, { status: "FRIENDS", requestId: null });
        qc.setQueryData<Friend[]>(qk.friends, (fs) =>
          fs && [{ user, since: new Date().toISOString() }, ...fs.filter((f) => f.user.id !== userId)],
        );
      }),
    }),
    onError: (e, _v, ctx) => {
      ctx?.rollback();
      toast.error(errorMessage(e));
    },
    onSettled: () => invalidateSocial(qc),
  });
}

// Reject (incoming) or cancel (outgoing)
export function useDeleteFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId }: RequestVars & { incoming: boolean }) => deleteFriendRequest(requestId),
    onMutate: async ({ requestId, userId, incoming }) => ({
      rollback: await optimistic(qc, touched, () => {
        removeRequest(qc, requestId);
        if (incoming) decrementRequestCount(qc);
        patchSearchUser(qc, userId, { status: "NONE", requestId: null });
      }),
    }),
    onError: (e, _v, ctx) => {
      ctx?.rollback();
      toast.error(errorMessage(e));
    },
    onSettled: () => invalidateSocial(qc),
  });
}

export function useUnfriend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => unfriend(userId),
    onMutate: async (userId) => ({
      rollback: await optimistic(qc, touched, () => {
        qc.setQueryData<Friend[]>(qk.friends, (fs) => fs?.filter((f) => f.user.id !== userId));
        patchSearchUser(qc, userId, { status: "NONE", requestId: null });
      }),
    }),
    onError: (e, _v, ctx) => {
      ctx?.rollback();
      toast.error(errorMessage(e));
    },
    onSettled: () => invalidateSocial(qc),
  });
}
