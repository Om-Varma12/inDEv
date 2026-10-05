import type { Request, Response } from "express";
import sandboxService from "../services/k8s/sandbox.service.js";
import kubernetesService from "../services/k8s/kubernetes.service.js";

export const runCode = async (req: Request, res: Response) => {
    const { projectId } = req.body;
    const userId = req.user?.id ? String(req.user.id) : undefined;

    if (!projectId) {
        return res.status(400).json({ success: false, message: "projectId is required" });
    }

    try {
        const sandbox = await sandboxService.getSandbox(userId, String(projectId));

        if (!sandbox) {
            return res.status(404).json({ success: false, message: "Sandbox not found" });
        }

        const projectPath = `/home/node/workspace/${sandbox.safeProjectName}`;

        // Start the Vite dev server inside the pod in background.
        // It binds to 0.0.0.0:5173 so the nginx Ingress can reach it.
        // Output is piped to /tmp/run.log for debugging via the terminal.
        await kubernetesService.executeCommandInBackground(
            sandbox.podName,
            ["/bin/bash", "-c", `cd ${projectPath} && npm run dev -- --host 0.0.0.0 --port 5173`]
        );

        // Wait up to 30s for Vite to bind port 5173 before declaring success
        const isPortOpen = await kubernetesService.waitForPortOpen(sandbox.podName, 5173);

        if (!isPortOpen) {
            return res.status(504).json({
                success: false,
                message: "Dev server started but port 5173 didn't open in time. Check /tmp/run.log in the terminal.",
            });
        }

        // The previewUrl was computed at createSandbox time:
        // http://<podName>.127.0.0.1.nip.io
        // minikube tunnel + nginx ingress routes it to this pod's Vite server.
        res.json({
            success: true,
            message: "Dev server is running",
            previewUrl: sandbox.previewUrl,
        });

    } catch (error: any) {
        console.error("Error running code:", error);
        res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
};