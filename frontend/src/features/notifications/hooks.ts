import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "../../lib/queryKeys";
import { getCounts, getNotifications, markAllNotificationsRead } from "./api";
import type { Counts } from "./types";

export function useCounts() {
  return useQuery({ queryKey: qk.counts, queryFn: getCounts });
}

export function useNotifications() {
  return useQuery({ queryKey: qk.notifications, queryFn: getNotifications, staleTime: 0 });
}


export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: () => {
      qc.setQueryData<Counts>(qk.counts, (c) => c && { ...c, notifications: 0 });
    },
    onError: () => qc.invalidateQueries({ queryKey: qk.counts }),
  });
}
