import type { z } from "zod";
import { AppError } from "./AppError";

export function parse<T>(schema: z.ZodType<T>, data: unknown, message: string) {
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new AppError(400, message);
  return parsed.data;
}
