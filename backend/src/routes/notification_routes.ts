import { Router } from "express";
import { counts, getNotifications, readAll, readOne } from "../controllers/notification_controller";

const router = Router();

router.get("/", getNotifications);
router.get("/counts", counts);
router.patch("/read-all", readAll);
router.patch("/:id/read", readOne);

export default router;
