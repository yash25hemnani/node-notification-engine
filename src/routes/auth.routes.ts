import { Router } from "express";
import { handleLoginOrSignup } from "../controllers/auth.controller";

const router = Router()

router.post("/", handleLoginOrSignup)

export default router