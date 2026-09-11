import { Router } from "express";
import { runCode } from "../controllers/sandbox.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post(
    "/run",
    authenticate,
    runCode
);

export default router;