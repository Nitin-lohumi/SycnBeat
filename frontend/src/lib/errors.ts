import axios from "axios";

export function errorMessage(e: unknown, fallback = "Something went wrong") {
  if (axios.isAxiosError<{ message?: string }>(e)) return e.response?.data?.message ?? fallback;
  return fallback;
}

export const isNotFound = (e: unknown) => axios.isAxiosError(e) && e.response?.status === 404;
