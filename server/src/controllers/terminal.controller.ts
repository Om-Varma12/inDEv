import WebSocket from "ws";
import kubernetesService from "../services/kubernetes.service.js";

export async function handleTerminalConnection(
    ws: WebSocket
){
    console.log("WebSocket client connected");

    let podName: string | null = null;

    ws.send(
        JSON.stringify({
            type: "connected",
            message: "WebSocket connection established",
        })
    );

    ws.on("message", async (data) => {
        try {
            const message = JSON.parse(data.toString());

            console.log("WebSocket message:", message);

            if (message.type === "create"){
                if (podName !== null){
                    ws.send(
                        JSON.stringify({
                            type: "error",
                            message: "Workspace already exists",
                        })
                    );
                    return;
                }

                podName = `indev-${Date.now()}`;

                await createWorkspacePod(
                    ws,
                    podName
                );
            }
        } 
        catch(error){
            console.error("WebSocket message error:", error);

            ws.send(
                JSON.stringify({
                    type: "error",
                    message: "Something went wrong",
                })
            );
        }
    });

    ws.on("close", async () => {
        console.log("WebSocket client disconnected");

        if(podName !== null){
            try{
                await kubernetesService.deletePod(podName);
                console.log(`Workspace ${podName} cleaned up`);
            } 
            catch(error){
                console.error(`Failed to delete Pod ${podName}:`,error);
            }
        }
    });

    ws.on("error", (error) => {
        console.error("WebSocket error:", error);
    });
}

async function createWorkspacePod(
    ws: WebSocket,
    podName: string
){
    try{
        ws.send(
            JSON.stringify({
                type: "creating",
                message: "Creating workspace...",
                podName,
            })
        );

        console.log(`Creating Pod: ${podName}`);

        await kubernetesService.createPod(
            podName
        );

        ws.send(
            JSON.stringify({
                type: "creating",
                message: "Waiting for workspace...",
                podName,
            })
        );

        await kubernetesService.waitForPodRunning(podName);

        console.log(`Pod ${podName} is running`);

        ws.send(
            JSON.stringify({
                type: "ready",
                message: "Workspace is ready",
                podName,
            })
        );
    } 
    catch(error){
        console.error(`Failed to create workspace ${podName}:`, error);

        ws.send(
            JSON.stringify({
                type: "error",
                message: "Failed to create workspace",
            })
        );
    }
}