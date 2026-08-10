import express from "express";
// import { sendMessage } from "../controllers/message.controller.js";

const router = express.Router();

router.post("/", (req, res) => {
    const { message } = req.body;

    console.log("User: ", message)

    res.json({
        msg: 'received'
    })
});

export default router;