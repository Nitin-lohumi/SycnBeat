import { Router } from "express";
import {
  acceptRequest,
  deleteRequest,
  getFriends,
  getRequests,
  sendRequest,
  unfriend,
} from "../controllers/friend_controller";

const router = Router();

router.get("/", getFriends);
router.get("/requests", getRequests);
router.post("/requests", sendRequest);
router.post("/requests/:id/accept", acceptRequest);
router.delete("/requests/:id", deleteRequest);
router.delete("/:userId", unfriend);

export default router;
