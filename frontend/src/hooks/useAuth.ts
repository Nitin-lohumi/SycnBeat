import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GetMe, LoginWithGoogle, logout } from "../api/auth.api";

export const ME_KEY = ["me"] as const;

export function useMe() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: GetMe,
    staleTime: Infinity,
  });
}

export function useLoginWithGoogle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: LoginWithGoogle,
    onSuccess: (user) => qc.setQueryData(ME_KEY, user), 
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      qc.setQueryData(ME_KEY, null);
      qc.removeQueries({ predicate: (q) => q.queryKey[0] !== ME_KEY[0] });
    },
  });
}
