import { Router } from "express";
import { getLiked, getLikedKeys, like, unlike } from "../controllers/like_controller";

const router = Router();

router.get("/", getLiked);
router.get("/keys", getLikedKeys);
router.put("/:source/:sourceId", like);
router.delete("/:source/:sourceId", unlike);

export default router;
