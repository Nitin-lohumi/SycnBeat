import jwt from "jsonwebtoken";
import type { CookieOptions, Response } from "express";
import { randomUUID } from "node:crypto";
import { env, isProd } from "../config/env";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

const ACCESS_TTL_SEC = 15 * 60; //15 min
const REFRESH_TTL_SEC = 7 * 24 * 60 * 60; // 7 days

const baseCookie: CookieOptions = {
  httpOnly: true, //can not read js (Xss safe)
  secure: isProd, // production HTTPS
  sameSite: isProd ? "none" : "lax",
  path: "/",
};

// Sign
function signAccessToken(userId: string) {
  return jwt.sign({}, env.JWT_ACCESS_SECRET, {
    subject: userId,
    expiresIn: ACCESS_TTL_SEC,
  });
}

function signRefreshToken(userId: string) {
  return jwt.sign({}, env.JWT_REFRESH_SECRET, {
    subject: userId,
    jwtid: randomUUID(),
    expiresIn: REFRESH_TTL_SEC,
  });
}

//verify
export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload & {
    sub: string;
  };
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as jwt.JwtPayload & {
    sub: string;
    jti: string;
  };
}


export function userIdFromTokens(accessToken?: string, refreshToken?: string) {
  try {
    if (accessToken) return verifyAccessToken(accessToken).sub;
  } catch {}
  try {
    if (refreshToken) return verifyRefreshToken(refreshToken).sub;
  } catch {}
  return null;
}

//cookies

export function setAuthCookies(res: Response, userId: string) {
  res.cookie(ACCESS_COOKIE, signAccessToken(userId), {
    ...baseCookie,
    maxAge: ACCESS_TTL_SEC * 1000,
  });
  res.cookie(REFRESH_COOKIE, signRefreshToken(userId), {
    ...baseCookie,
    maxAge: REFRESH_TTL_SEC * 1000,
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, baseCookie);
  res.clearCookie(REFRESH_COOKIE, baseCookie);
}
