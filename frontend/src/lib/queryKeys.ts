export const qk = {
  counts: ["counts"] as const,
  friends: ["friends"] as const,
  friendRequests: ["friend-requests"] as const,
  userSearchAll: ["user-search"] as const,
  userSearch: (q: string) => ["user-search", q] as const,
  notifications: ["notifications"] as const,
};
