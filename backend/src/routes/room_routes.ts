import { Router } from "express";
import {
  accept,
  addTracks,
  create,
  decline,
  getAll,
  getOne,
  getQueue,
  invitable,
  invite,
  kick,
  leaveForGood,
  remove,
  removeTrack,
  reorder,
  update,
  updateMember,
} from "../controllers/room_controller";

const router = Router();

router.get("/", getAll);
router.post("/", create);
router.get("/:id", getOne);
router.patch("/:id", update);
router.delete("/:id", remove);

router.get("/:id/invitable", invitable);
router.post("/:id/invites", invite);
router.post("/:id/invite/accept", accept);
router.post("/:id/invite/decline", decline);

router.delete("/:id/membership", leaveForGood);
router.patch("/:id/members/:userId", updateMember);
router.delete("/:id/members/:userId", kick);

router.get("/:id/tracks", getQueue);
router.post("/:id/tracks", addTracks);
router.put("/:id/tracks/order", reorder);
router.delete("/:id/tracks/:source/:sourceId", removeTrack);

export default router;
