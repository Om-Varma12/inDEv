import type {Request, Response} from "express"

export const sendMessage = (req: Request, res: Response) => {
    const {message} = req.body;

    console.log("user message: ", message);

    res.json({
        success: true,
        msg: 'msg received'
    })
}
