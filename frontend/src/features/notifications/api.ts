import { api } from "../../api/axios";
import type { AppNotification, Counts } from "./types";

export async function getCounts() {
  const { data } = await api.get<Counts>("/api/notifications/counts");
  return data;
}

export async function getNotifications() {
  const { data } = await api.get<{ notifications: AppNotification[] }>("/api/notifications");
  return data.notifications;
}

export async function markAllNotificationsRead() {
  await api.patch("/api/notifications/read-all");
}
