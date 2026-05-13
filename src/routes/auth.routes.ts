import { Router } from "express";
import {
  handleLogin,
  handleLogout,
  handleRefresh,
  handleSignup
} from "../controllers/auth.controller";
import { createTemplate } from "../controllers/templates.controller";

const router = Router();

router.post("/login", handleLogin);
router.post("/signup", handleSignup);
router.get("/refresh", handleRefresh);
router.post("/logout", handleLogout)
router.post("/create", createTemplate)

export default router;
