import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

const GoogleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(idToken: string) {
  const ticket = await GoogleClient.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  }).catch(() => null);

  const p = ticket?.getPayload();
  if (!p?.email || !p.email_verified)
    throw new AppError(401, "Invalid Google token");

  return {
    googleId: p.sub,
    email: p.email,
    name: p.name ?? p.email.split("@")[0]!,
    avatarUrl: p.picture ?? null,
  };
}

async function generateUsername(email: string) {
  const base =
    email
      .split("@")[0]!
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 15) || "user";

  for (let i = 0; i < 5; i++) {
    const username = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
    const taken = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!taken) return username;
  }
  return `${base}${Date.now()}`;
}

export async function loginWithGoogle(idToken: string) {
  const g = await verifyGoogleToken(idToken);
  let user = await prisma.user.findUnique({ where: { googleId: g.googleId } });
  if (!user) {
    user = await prisma.user.create({
      data: { ...g, username: await generateUsername(g.email) },
    });
  }
  return user;
}
