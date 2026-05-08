import { Router } from "express";
import { openFile } from "../controllers/misc.controller";

const router = Router();

router.get("/", openFile);

export default router;
