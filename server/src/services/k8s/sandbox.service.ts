import { randomUUID } from "node:crypto";
import kubernetesService from "./kubernetes.service.js";

// The minikube tunnel exposes the ingress LoadBalancer on 127.0.0.1.
// nip.io resolves <anything>.127.0.0.1.nip.io back to 127.0.0.1, so the
// browser hits the tunnel → nginx ingress → the correct pod Service.
const MINIKUBE_IP = "127.0.0.1";

class SandboxService {
	private sandboxes = new Map<string, {
		sandboxId: string;
		safeProjectName: string;
		podName: string;
		previewUrl: string;
	}>();


	async createSandbox(projectName: string) {
		const sandboxId = randomUUID();

		const safeProjectName = projectName
			.toLowerCase()
			.replace(/[^a-z0-9-]/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-|-$/g, "");

		const podName = `${safeProjectName}-${sandboxId}`;

		// The nip.io hostname: <podName>.<minikubeIP>.nip.io
		// e.g. build-me-a-abc123.127.0.0.1.nip.io
		const host = `${podName}.${MINIKUBE_IP}.nip.io`;
		const previewUrl = `http://${host}`;

		// 1. Spin up the pod and wait for it to be Running
		await kubernetesService.createPod(podName);
		await kubernetesService.waitForPodRunning(podName);

		// 2. Create the ClusterIP Service that selects this exact pod
		await kubernetesService.createService(podName);

		// 3. Create the Ingress rule that routes the nip.io hostname to the Service
		await kubernetesService.createIngress(podName, host);

		const sandbox = { sandboxId, safeProjectName, podName, previewUrl };
		this.sandboxes.set(sandboxId, sandbox);

		console.log(`Sandbox ready: ${podName} | preview: ${previewUrl}`);
		return sandbox;
	}


	async createProject(podName: string, projectName: string) {
		await kubernetesService.executeCommand(
			podName,
			["mkdir", "-p", `/home/node/workspace/${projectName}`]
		);
	}


	async createDirectory(podName: string, projectPath: string) {
		await kubernetesService.executeCommand(podName, ["mkdir", "-p", projectPath]);
	}


	async writeFile(podName: string, filePath: string, content: string) {
		const base64Content = Buffer.from(content).toString("base64");
		await kubernetesService.executeCommand(
			podName,
			["/bin/bash", "-c", `mkdir -p "$(dirname "${filePath}")" && echo "${base64Content}" | base64 -d > "${filePath}"`]
		);
	}


	async readFile(podName: string, filePath: string) {
		return await kubernetesService.executeCommand(podName, ["cat", filePath]);
	}


	async connectShell(podName: string, stdin: any, stdout: any, stderr: any) {
		await kubernetesService.connectToShell(podName, stdin, stdout, stderr);
	}


	getSandbox(userId: string | undefined, projectId: string) {
		return this.sandboxes.get(projectId);
	}
}



export default new SandboxService();