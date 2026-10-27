import axios from "axios";
import { api } from "./axios";
import type { User } from "../types/user";

export async function LoginWithGoogle(idToken: String) {
  const { data } = await api.post<{ user: User }>("/api/auth/google", {
    idToken,
  });
  return data.user;
}

export async function GetMe(): Promise<User | null> {
  try {
    const { data } = await api.get<{ user: User }>("/api/auth/me");
    return data.user;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status == 401) return null;
    throw error;
  }
}

export async function logout() {
  await api.post("/api/auth/logout");
}
