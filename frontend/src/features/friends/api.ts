import { api } from "../../api/axios";
import type { Friend, FriendRequests, SearchUser, SendRequestResult } from "./types";

export async function searchUsers(q: string) {
  const { data } = await api.get<{ users: SearchUser[] }>("/api/users/search", { params: { q } });
  return data.users;
}

export async function getFriends() {
  const { data } = await api.get<{ friends: Friend[] }>("/api/friends");
  return data.friends;
}

export async function getFriendRequests() {
  const { data } = await api.get<FriendRequests>("/api/friends/requests");
  return data;
}

export async function sendFriendRequest(userId: string) {
  const { data } = await api.post<SendRequestResult>("/api/friends/requests", { userId });
  return data;
}

export async function acceptFriendRequest(requestId: string) {
  await api.post(`/api/friends/requests/${requestId}/accept`);
}

export async function deleteFriendRequest(requestId: string) {
  await api.delete(`/api/friends/requests/${requestId}`);
}

export async function unfriend(userId: string) {
  await api.delete(`/api/friends/${userId}`);
}
