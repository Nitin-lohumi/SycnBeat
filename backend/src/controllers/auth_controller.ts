import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { loginWithGoogle } from "../services/auth_service";
import { AppError } from "../utils/AppError";
import { clearAuthCookies, setAuthCookies } from "../utils/jwt";

const googleBody = z.object({ idToken: z.string().min(1) });

export async function googleLogin(req: Request, res: Response) {
  const parsed = googleBody.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, "idToken is required");
  const user = await loginWithGoogle(parsed.data.idToken);
  setAuthCookies(res, user.id);
  res.json({ user });
}

export async function logout(_req: Request, res: Response) {
  clearAuthCookies(res);
  res.status(204).end();
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) throw new AppError(404, "User not found");
  res.json({ user });
}
