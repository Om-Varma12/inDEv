import type { Request, Response } from "express";

export const sendMessage = (req: Request, res: Response) => {
    const { message } = req.body;

    console.log("User:", message);

    res.json({
        success: true,
        message: "Message received"
    });
};