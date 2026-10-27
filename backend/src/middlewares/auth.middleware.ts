import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearAuthCookies,
  setAuthCookies,
  verifyAccessToken,
  verifyRefreshToken,
} from "../utils/jwt";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const accessToken = req.cookies?.[ACCESS_COOKIE];
  const refreshToken = req.cookies?.[REFRESH_COOKIE];
  if (accessToken) {
    try {
      req.userId = verifyAccessToken(accessToken).sub;
      return next();
    } catch (error) {}
  }
  if (!refreshToken) throw new AppError(401, "Please login");
  let userId: string;
  try {
    userId = verifyRefreshToken(refreshToken).sub;
  } catch {
    clearAuthCookies(res);
    throw new AppError(401, "Session expired, login again");
  }
  setAuthCookies(res, userId);
  req.userId = userId;
  next();
}
