import type { Request, Response } from "express";
import {
  getCounts,
  listNotifications,
  markAllRead,
  markRead,
} from "../services/notification_service";

export async function getNotifications(req: Request, res: Response) {
  res.json({ notifications: await listNotifications(req.userId!) });
}

export async function counts(req: Request, res: Response) {
  res.json(await getCounts(req.userId!));
}

export async function readOne(req: Request<{ id: string }>, res: Response) {
  await markRead(req.userId!, req.params.id);
  res.status(204).end();
}

export async function readAll(req: Request, res: Response) {
  await markAllRead(req.userId!);
  res.status(204).end();
}
