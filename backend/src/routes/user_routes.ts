import { Router } from "express";
import { search } from "../controllers/user_controller";

const router = Router();

router.get("/search", search);

export default router;
