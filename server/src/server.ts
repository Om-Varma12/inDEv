import express from "express";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";

import chatRoutes from "./routes/chat.routes.js";
import { handleTerminalConnection } from "./controllers/terminal.controller.js";
import { authenticateWebSocket } from "./middleware/ws-auth.middleware.js";


const PORT = process.env.PORT;
const app = express();
const server = createServer(app);
app.use(express.json());


app.use('/api/chat', chatRoutes);


const wss = new WebSocketServer({
    noServer: true,
});

server.on("upgrade", async (request, Socket, head) => {
    const url = new URL(
        request.url ?? "",
        `http://${request.headers.host}`
    );

    if(url.pathname !== "/ws/terminal"){
        Socket.destroy();
        return;
    }

    try{
        const user = await authenticateWebSocket(request);

        wss.handleUpgrade(
            request,
            Socket,
            head,
            (ws) => {
                handleTerminalConnection(ws, user)
            }
        )
    }
    catch(error){
        console.log("error", error);
            Socket.write(
            "HTTP/1.1 401 Unauthorized\r\n" +
            "Connection: close\r\n" +
            "\r\n"
        );

        Socket.destroy();
    }
});



server.listen(PORT, () => {
    console.log(`server running at ${PORT}`);
});