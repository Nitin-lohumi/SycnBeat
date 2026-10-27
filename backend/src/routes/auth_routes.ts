import { Router } from "express";
import { googleLogin, logout} from "../controllers/auth_controller";

const router = Router();

router.post("/google", googleLogin);
router.post("/logout", logout);


export default router;
