import express from "express";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";

import chatRoutes from "./routes/chat.routes.js";
import { handleTerminalConnection } from "./controllers/terminal.controller.js";
import { create } from "node:domain";


const app = express();
app.use(express.json());

app.use('/api/chat', chatRoutes);
app.use('/', () => {
    console.log("server is running")
});

const PORT = process.env.PORT;

const server = createServer(app);

const wss = new WebSocketServer({
    server, 
    path: "/ws/terminal",
});

wss.on("connection", handleTerminalConnection);


server.listen(PORT, () => {
    console.log(`server running at ${PORT}`);
});