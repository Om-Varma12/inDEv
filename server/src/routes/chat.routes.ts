import { Router } from "express";
import { sendMessage } from "../controllers/chat.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post(
    "/", 
    authenticate,
    sendMessage
);

export default router;