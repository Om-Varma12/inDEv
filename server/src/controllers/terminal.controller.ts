import WebSocket from "ws";
import { PassThrough } from "node:stream";

import sandboxService from "../services/k8s/sandbox.service.js";

export async function handleTerminalConnection(
    ws: WebSocket,
    user: any
) {
    console.log("WebSocket client connected");
    console.log("Authenticated user:", user);

    let shellStdin: PassThrough | null = null;

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
                    sandbox.podName
                );
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

    ws.on("close", () => {
        console.log("WebSocket client disconnected");

        // DO NOT delete the pod here.
        //
        // The pod belongs to the project,
        // not to this WebSocket connection.
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
    podName: string
): Promise<PassThrough> {

    try {

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

            if (ws.readyState === WebSocket.OPEN) {
                ws.send(data.toString());
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