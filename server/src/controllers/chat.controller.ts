import type { Request, Response } from "express";
import { processUserMessage } from "../services/chat.service.js";


export const sendMessage = async (req: Request, res: Response) => {
    const { message } = req.body;

    const projectStructure = await processUserMessage(message);

    res.json({
        success: true,
        message: projectStructure
    });
};