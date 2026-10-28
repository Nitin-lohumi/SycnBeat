import { Router } from "express";
import { getAll, getOne, messages, open, read, send } from "../controllers/chat_controller";

const router = Router();

router.get("/", getAll);
router.post("/", open);
router.get("/:id", getOne);
router.get("/:id/messages", messages);
router.post("/:id/messages", send);
router.post("/:id/read", read);

export default router;
