import type { Request, Response } from "express";
import sandboxService from "../services/k8s/sandbox.service.js";
import kubernetesService from "../services/k8s/kubernetes.service.js";

export const runCode = async (req: Request, res: Response) => {
    const { projectId } = req.body;
    const userId = req.user?.id;

    if (!projectId) {
        return res.status(400).json({ success: false, message: "projectId is required" });
    }

    try {
        const sandbox = await sandboxService.getSandbox(userId, projectId);

        if (!sandbox) {
            return res.status(404).json({ success: false, message: "Sandbox not found" });
        }

        const projectPath = `/home/node/workspace/${sandbox.safeProjectName}`;

        // We run the setup and the server in a single background shell sequence
        // 1. cd to project dir
        // 2. install dependencies
        // 3. run dev server in background (nohup)
        const fullCommand = `cd ${projectPath} && npm install && nohup npm run dev -- --host 0.0.0.0 > /tmp/run.log 2>&1 </dev/null &`;

        // Execute the sequence in the background
        await kubernetesService.executeCommandInBackground(sandbox.podName, ["/bin/bash", "-c", fullCommand]);

        // Wait for the port to open before starting port-forwarding
        const isPortOpen = await kubernetesService.waitForPortOpen(sandbox.podName, 5173);

        if (!isPortOpen) {
            return res.status(504).json({
                success: false,
                message: "Server started but port 5173 didn't become available in time. Please check terminal logs."
            });
        }

        // Start port-forwarding
        await kubernetesService.portForward(sandbox.podName, 5174, 5173);

        res.json({
            success: true,
            message: "Deployment sequence completed: Server is running and port-forwarded",
            previewUrl: "http://localhost:5174"
        });
    } catch (error: any) {
        console.error("Error running code:", error);
        res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
};