import { randomUUID } from "node:crypto";

import kubernetesService from "./kubernetes.service.js";

class SandboxService{
    private sandboxes = new Map<string, {
        sandboxId: string;
        safeProjectName: string;
        podName: string;
    }>();

    async createSandbox(
        projectName: string,
    ){
        const sandboxId = randomUUID();

        const safeProjectName = projectName
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");

        const podName = `${safeProjectName}-${sandboxId}`;

        await kubernetesService.createPod(podName);
        await kubernetesService.waitForPodRunning(podName);

        const sandbox = {
            sandboxId,
            safeProjectName,
            podName,
        };

        this.sandboxes.set(sandboxId, sandbox);

        return sandbox;
    }


    async createProject(
        podName: string,
        projectName: string,
    ){
        await kubernetesService.executeCommand(
            podName,
            ["mkdir", "-p", `/workspace/${projectName}`]
        );
    }
    

    async createDirectory(
        podName: string,
        projectPath: string
    ){
        await kubernetesService.executeCommand(
            podName,
            ["mkdir", "-p", projectPath]
        );
    }


    async writeFile(
        podName: string,
        filePath: string,
        content: string
    ){
        const base64Content = Buffer.from(content).toString("base64");
        await kubernetesService.executeCommand(
            podName,
            ["/bin/bash", "-c", `mkdir -p "$(dirname "${filePath}")" && echo "${base64Content}" | base64 -d > "${filePath}"`]
        );
    }


    async readFile(
        podName: string,
        filePath: string
    ){
        return await kubernetesService.executeCommand(
            podName,
            ["cat", filePath]
        );
    }


    async connectShell(
        podName: string,
        stdin: any,
        stdout: any,
        stderr: any
    ) {
        await kubernetesService.connectToShell(
            podName,
            stdin,
            stdout,
            stderr
        );
    }


    getSandbox(userId: string | undefined, projectId: string) {
        return this.sandboxes.get(projectId);
    }
}



export default new SandboxService();