import * as k8s from "@kubernetes/client-node";
import { Readable, Writable } from "stream";

const NAMESPACE = "loom-workspaces";

class KubernetesService {
	private kubeConfig: k8s.KubeConfig;
	private coreApi: k8s.CoreV1Api;
	private networkingApi: k8s.NetworkingV1Api;
	private exec: k8s.Exec;

	constructor() {
		this.kubeConfig = new k8s.KubeConfig();
		this.kubeConfig.loadFromDefault();
		this.coreApi = this.kubeConfig.makeApiClient(k8s.CoreV1Api);
		this.networkingApi = this.kubeConfig.makeApiClient(k8s.NetworkingV1Api);
		this.exec = new k8s.Exec(this.kubeConfig);
	}


	// ── Pod ──────────────────────────────────────────────────────────────────

	async createPod(podName: string): Promise<void> {
		const pod: k8s.V1Pod = {
			apiVersion: "v1",
			kind: "Pod",
			metadata: {
				name: podName,
				labels: {
					// unique label so the Service selector can target exactly this pod
					"indev-pod": podName,
				},
			},
			spec: {
				containers: [
					{
						name: "workspace",
						image: "node:20",
						command: ["/bin/bash", "-c", "sleep infinity"],
						stdin: true,
						stdinOnce: false,
						tty: true,
						resources: {
							requests: { cpu: "250m", memory: "512Mi" },
							limits: { cpu: "1", memory: "1536Mi" },
						},
						securityContext: {
							runAsNonRoot: true,
							runAsUser: 1000,    // UID 1000 = 'node' user in node:20 image
							runAsGroup: 1000,
							allowPrivilegeEscalation: false,
							capabilities: { drop: ["ALL"] },
							seccompProfile: { type: "RuntimeDefault" },
						},
					},
				],
			},
		};

		await this.coreApi.createNamespacedPod({ namespace: NAMESPACE, body: pod });
	}


	async waitForPodRunning(podName: string): Promise<void> {
		while (true) {
			const response = await this.coreApi.readNamespacedPod({
				name: podName,
				namespace: NAMESPACE,
			});
			const phase = response.status?.phase;
			console.log(`Pod ${podName} status: ${phase}`);

			if (phase === "Running") return;
			if (phase === "Failed" || phase === "Unknown") {
				throw new Error(`Pod ${podName} failed with status ${phase}`);
			}
			await new Promise((r) => setTimeout(r, 1000));
		}
	}


	// Deletes pod + its Service + its Ingress rule all at once
	async deletePod(podName: string): Promise<void> {
		await Promise.allSettled([
			this.coreApi.deleteNamespacedPod({ name: podName, namespace: NAMESPACE }),
			this.deleteService(podName),
			this.deleteIngress(podName),
		]);
		console.log(`Pod + Service + Ingress deleted for ${podName}`);
	}


	// ── Service ──────────────────────────────────────────────────────────────

	async createService(podName: string): Promise<void> {
		const service: k8s.V1Service = {
			apiVersion: "v1",
			kind: "Service",
			metadata: { name: podName, namespace: NAMESPACE },
			spec: {
				// targets the specific pod via the unique label stamped at pod creation
				selector: { "indev-pod": podName },
				ports: [
					{
						name: "vite",
						port: 5173,
						targetPort: 5173 as any,
						protocol: "TCP",
					},
				],
				type: "ClusterIP",
			},
		};

		await this.coreApi.createNamespacedService({ namespace: NAMESPACE, body: service });
		console.log(`Service created for pod ${podName}`);
	}


	async deleteService(podName: string): Promise<void> {
		try {
			await this.coreApi.deleteNamespacedService({ name: podName, namespace: NAMESPACE });
			console.log(`Service deleted: ${podName}`);
		} catch (e: any) {
			if (e?.response?.statusCode !== 404) throw e;
		}
	}


	// ── Ingress ──────────────────────────────────────────────────────────────

	// host example: "build-me-a-<uuid>.127.0.0.1.nip.io"
	async createIngress(podName: string, host: string): Promise<void> {
		const ingress: k8s.V1Ingress = {
			apiVersion: "networking.k8s.io/v1",
			kind: "Ingress",
			metadata: {
				name: podName,
				namespace: NAMESPACE,
				annotations: {
					// Do NOT use rewrite-target here — Vite serves assets at paths like
					// /@vite/client, /src/main.tsx, /node_modules/.vite/deps/react.js etc.
					// Rewriting everything to "/" breaks all of them.
					// Instead, just pass the request path through unchanged.
					//
					// Allow long-lived connections for Vite HMR WebSocket
					"nginx.ingress.kubernetes.io/proxy-read-timeout": "3600",
					"nginx.ingress.kubernetes.io/proxy-send-timeout": "3600",
				},
			},
			spec: {
				ingressClassName: "nginx",
				rules: [
					{
						host,
						http: {
							paths: [
								{
									path: "/",
									pathType: "Prefix",
									backend: {
										service: {
											name: podName,
											port: { number: 5173 },
										},
									},
								},
							],
						},
					},
				],
			},
		};

		await this.networkingApi.createNamespacedIngress({ namespace: NAMESPACE, body: ingress });
		console.log(`Ingress created: ${host} → ${podName}:5173`);
	}


	async deleteIngress(podName: string): Promise<void> {
		try {
			await this.networkingApi.deleteNamespacedIngress({ name: podName, namespace: NAMESPACE });
			console.log(`Ingress deleted: ${podName}`);
		} catch (e: any) {
			if (e?.response?.statusCode !== 404) throw e;
		}
	}


	// ── Shell / exec ─────────────────────────────────────────────────────────

	async connectToShell(
		podName: string,
		stdin: Readable,
		stdout: Writable,
		stderr: Writable,
	): Promise<void> {
		await this.exec.exec(
			NAMESPACE, podName, "workspace",
			["/bin/bash"],
			stdout, stderr, stdin,
			true,
		);
	}


	async executeCommand(podName: string, command: string[]): Promise<string> {
		return new Promise(async (resolve, reject) => {
			let output = "";

			const stdout = new Writable({
				write(chunk, _, cb) { output += chunk.toString(); cb(); }
			});
			const stderr = new Writable({
				write(chunk, _, cb) { output += chunk.toString(); cb(); }
			});
			const stdin = new Readable({ read() { this.push(null); } });

			try {
				const ws = await this.exec.exec(
					NAMESPACE, podName, "workspace",
					command,
					stdout, stderr, stdin,
					false,
				);
				// exec.exec() resolves when the WS opens — NOT when the command exits.
				// Wait for 'close' so every sequential command truly finishes before continuing.
				ws.on("close", () => resolve(output));
				ws.on("error", (err: Error) => reject(err));
			} catch (err) {
				reject(err);
			}
		});
	}


	async executeCommandInBackground(podName: string, script: string): Promise<void> {
		return new Promise(async (resolve, reject) => {
			const stdout = new Writable({ write: (_, __, cb) => cb() });
			const stderr = new Writable({ write: (_, __, cb) => cb() });
			const stdin = new Readable({ read() { this.push(null); } });

			try {
				const backgroundCommand = [
					"/bin/bash", "-c",
					`nohup bash -c ${JSON.stringify(script)} > /tmp/run.log 2>&1 &`,
				];
				await this.exec.exec(
					NAMESPACE, podName, "workspace",
					backgroundCommand,
					stdout, stderr, stdin,
					false,
				);
				resolve(); // fire-and-forget — the process is running in the pod
			} catch (err) {
				reject(err);
			}
		});
	}


	async waitForPortOpen(podName: string, port: number, timeoutMs = 30_000): Promise<boolean> {
		const deadline = Date.now() + timeoutMs;
		while (Date.now() < deadline) {
			try {
				await this.executeCommand(podName, ["/bin/bash", "-c", `nc -z localhost ${port}`]);
				console.log(`Port ${port} is open on pod ${podName}`);
				return true;
			} catch {
				await new Promise((r) => setTimeout(r, 1000));
			}
		}
		console.error(`Timeout waiting for port ${port} on pod ${podName}`);
		return false;
	}
}



export default new KubernetesService();