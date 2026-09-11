import WebSocket from "ws";
import { PassThrough } from "node:stream";

import sandboxService from "../services/k8s/sandbox.service.js";

export async function handleTerminalConnection(
    ws: WebSocket,
    user: any
) {
    console.log("WebSocket client connected");
    // console.log("Authenticated user:", user);

    let shellStdin: PassThrough | null = null;
    let currentPodName: string | null = null;

    ws.send(
        JSON.stringify({
            type: "connected",
            message: "WebSocket connection established",
        })
    );

    ws.on("message", async (data) => {
        try {
            const message = JSON.parse(data.toString());

            // console.log("WebSocket message:", message);

            if (message.type === "input") {
                if (shellStdin === null) {
                    ws.send(
                        JSON.stringify({
                            type: "error",
                            message: "Shell is not ready",
                        })
                    );
                    return;
                }

                shellStdin.write(message.data);
                return;
            }

            if (message.type === "connect") {

                if (shellStdin !== null) {
                    ws.send(
                        JSON.stringify({
                            type: "error",
                            message: "Already connected to workspace",
                        })
                    );
                    return;
                }

                const projectId = message.projectId;

                if (!projectId) {
                    ws.send(
                        JSON.stringify({
                            type: "error",
                            message: "projectId is required",
                        })
                    );
                    return;
                }

                const sandbox = await sandboxService.getSandbox(
                    user.id,
                    projectId
                );

                if (!sandbox) {
                    ws.send(
                        JSON.stringify({
                            type: "error",
                            message: "Workspace not found",
                        })
                    );
                    return;
                }

                shellStdin = await connectToWorkspace(
                    ws,
                    sandbox.podName,
                    sandbox
                );
                currentPodName = sandbox.podName;
            }

        } catch (error) {

            console.error(
                "WebSocket message error:",
                error
            );

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

        if (currentPodName) {
            await sandboxService.stopPortForward(currentPodName);
        }
    });

    ws.on("error", (error) => {
        console.error(
            "WebSocket error:",
            error
        );
    });
}


async function connectToWorkspace(
    ws: WebSocket,
    podName: string,
    sandbox: any
): Promise<PassThrough> {

    try {
        console.log("CONNECTING TO POD:", podName);
        ws.send(
            JSON.stringify({
                type: "connecting",
                message: "Connecting to workspace...",
                podName,
            })
        );

        const stdin = new PassThrough();
        const stdout = new PassThrough();
        const stderr = new PassThrough();

        stdout.on("data", (data: Buffer) => {
            const output = data.toString();

            if (ws.readyState === WebSocket.OPEN) {
                ws.send(output);
            }

            // Detect port-forwarding trigger
            if (output.includes("Local: http://localhost:5173/")) {
                console.log(`Port-forwarding trigger detected for ${podName}`);
                sandboxService.portForward(podName, 5174, 5173).then(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({
                            type: "preview_ready",
                            url: "http://localhost:5174"
                        }));
                    }
                }).catch(err => console.error(`Failed to port-forward ${podName}:`, err));
            }
        });

        stderr.on("data", (data: Buffer) => {

            if (ws.readyState === WebSocket.OPEN) {
                ws.send(data.toString());
            }

        });

        await sandboxService.connectShell(
            podName,
            stdin,
            stdout,
            stderr
        );

        // Auto-CD to project directory
        stdin.write(`cd /home/node/workspace/${sandbox.safeProjectName}\n`);

        return stdin;

    } catch (error) {

        console.error(
            `Failed to connect to workspace ${podName}:`,
            error
        );

        ws.send(
            JSON.stringify({
                type: "error",
                message: "Failed to connect to workspace",
            })
        );

        throw error;
    }
}