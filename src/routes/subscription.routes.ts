import { Router } from "express";
import { createSubscription, listSubscriptions } from "../controllers/push.controller";

const router = Router()

router.post("/subscribe", createSubscription);
router.get("/list", listSubscriptions);

export default router;
