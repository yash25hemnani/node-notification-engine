import { Router } from "express";
import { createSubscription } from "../controllers/push.controller";

const router = Router()

router.post("/subscribe", createSubscription);

export default router;
