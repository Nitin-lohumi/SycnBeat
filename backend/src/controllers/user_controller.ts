import type { Request, Response } from "express";
import { z } from "zod";
import { searchUsers } from "../services/user_service";
import { AppError } from "../utils/AppError";

const searchQuery = z.object({ q: z.string().trim().max(50).default("") });

export async function search(req: Request, res: Response) {
  const parsed = searchQuery.safeParse(req.query);
  if (!parsed.success) throw new AppError(400, "Invalid search query");
  const users = await searchUsers(req.userId!, parsed.data.q);
  res.json({ users });
}
