import { Router } from "express";
import {
  handleLoginOrSignup,
  handleLogout,
  handleRefresh,
} from "../controllers/auth.controller";

const router = Router();

router.post("/", handleLoginOrSignup);
router.post("/refresh", handleRefresh);
router.post("/logout", handleLogout)

export default router;
