import { Router } from "express";
import {
  addTrack,
  create,
  getAll,
  getOne,
  membership,
  remove,
  removeTrack,
  update,
} from "../controllers/playlist_controller";

const router = Router();

router.get("/", getAll);
router.post("/", create);
router.get("/membership", membership);
router.get("/:id", getOne);
router.patch("/:id", update);
router.delete("/:id", remove);
router.post("/:id/tracks", addTrack);
router.delete("/:id/tracks/:source/:sourceId", removeTrack);

export default router;
