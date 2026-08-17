import WebSocket from "ws";
import kubernetesService from "../services/kubernetes.service.js";
import { error } from "node:console";

export async function handleTerminalConnection(
    ws: WebSocket
){
    console.log("ws client connected");

    ws.send(
        JSON.stringify({
            type: "connected",
            message: "ws connection established",
        })
    )
    ws.on("message", async(data) => {
        try{
            const message = JSON.parse(data.toString());
            console.log("ws msg: ", message);

            if(message.type == "create"){
                await createWorkspacePod(ws);
            }
        }
        catch(error){
            console.log(error);

            ws.send(
                JSON.stringify({
                    type: "error",
                    message: "something went wrong",
                })
            );
        }
    });

    ws.on("close", () => {
        console.log("ws client disconnected");
    })
    
    ws.on("error", () => {
        console.log("ws error: ", error);
    })
}


async function createWorkspacePod(
    ws: WebSocket
){
    const podName = `indev-${Date.now()}`;

    ws.send(
        JSON.stringify({
            type: "creating",
            message: "creating workspace......",    
        })
    );

    console.log(`creating pod ${podName}`);

    await kubernetesService.createPod(podName);

    ws.send(
        JSON.stringify({
            type: "creating",
            message: "waiting for workspace....",
            podName,
        })
    );

    await kubernetesService.waitForPodRunning(podName);

    console.log(`pod ${podName} is running`);

    ws.send(
        JSON.stringify({
            type: "ready",
            message: "workspace is ready",
            podName,
        })
    );
}