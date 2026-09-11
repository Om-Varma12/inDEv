import * as k8s from "@kubernetes/client-node";
import { Readable, Writable } from "stream";
import { spawn, ChildProcess } from "node:child_process";

class KubernetesService{
	private kubeConfig: k8s.KubeConfig;
	private coreApi: k8s.CoreV1Api;
	private exec: k8s.Exec;
	private portForwards = new Map<string, ChildProcess>();

	constructor(){
		this.kubeConfig = new k8s.KubeConfig();
		this.kubeConfig.loadFromDefault();
		this.coreApi = this.kubeConfig.makeApiClient(k8s.CoreV1Api);
		this.exec = new k8s.Exec(this.kubeConfig);
	}


	async createPod(
		podName: string
	): Promise<void> {
		// we cannot make .yaml file for this, as the name is being passed from route and its dynamic,
		// writing in .yaml would keep it hardcoded and static
		const pod: k8s.V1Pod = {
			apiVersion: "v1",
			kind: "Pod",

			metadata: {
				name: podName,
			},

			spec: {
				containers: [
					{
						name: "workspace",
						image: "node:20",
						command: [
							"/bin/bash",
							"-c",
							"sleep infinity",
						],
						stdin: true,
						stdinOnce: false,
						tty: true,

						resources: {
							requests: {
								cpu: "250m",
								memory: "512Mi",
							},
							limits: {
								cpu: "1",
								memory: "1536Mi",
							},
						},

						securityContext: {
							runAsNonRoot: true,
							runAsUser: 1000,    // -> this is user id assigned to user accessing this pod, so its not 'root' user
							runAsGroup: 1000,
							allowPrivilegeEscalation: false,
							// UID 1000 is an ordinary user.
							// Normally, that process has only the permissions granted to user 1000.
							// Privilege escalation means the process somehow causes a new process to have more privilege than it started with.
							// this key restricts that

							capabilities: {
								drop: ["ALL"]
							},

							seccompProfile: {
								type: "RuntimeDefault",
							},
							// => secure computing
						}
					},
				],
			},
		};

		await this.coreApi.createNamespacedPod({
			namespace: "loom-workspaces",
			body: pod,
		});
	}


	async waitForPodRunning(podName: string): Promise<void> {
		while(true){
			const response = await this.coreApi.readNamespacedPod({
				name: podName,
				namespace: "loom-workspaces",
			});

			const phase = response.status?.phase;

			console.log(`Pod ${podName} status: ${phase}`);

			if(phase == "Running"){
				return;
			}
			if(phase == "Failed" || phase == "Unknown"){
				throw new Error(`Pod ${podName} failed with status ${phase}`);
			}

			// kind of sleep() function...
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}


	async deletePod(podName: string): Promise<void> {
		await this.coreApi.deleteNamespacedPod({
			name: podName,
			namespace: "loom-workspaces",
		});

		console.log(`pod ${podName} deleted`);
	}


	async connectToShell(
		podName: string,
		stdin: Readable,
		stdout: Writable,
		stderr: Writable,
	): Promise<void> {
		await this.exec.exec(
			"loom-workspaces",
			podName,
			"workspace",
			["/bin/bash"],
			stdout,
			stderr,
			stdin,
			true,
		);
	}


	async executeCommand(
		podName: string,
		command: string[],
	): Promise<string> {
		return new Promise(async (resolve, reject) => {
			let output = "";

			const stdout = new Writable({
				write(chunk, encoding, callback){
					output += chunk.toString();
					callback();
				}
			});

			const stderr = new Writable({
				write(chunk, encoding, callback){
					output += chunk.toString();
					callback();
				}
			});

			const stdin = new Readable({
				read(){
					this.push(null);
				}
			});

			try {
				const ws = await this.exec.exec(
					"loom-workspaces",
					podName,
					"workspace",
					command,
					stdout,
					stderr,
					stdin,
					false,
				);

				// exec.exec() resolves when the WS connection opens — NOT when the
				// command finishes. We must wait for 'close' (process exited) or
				// 'error' (connection dropped) to know the command is actually done.
				ws.on("close", () => resolve(output));
				ws.on("error", (err: Error) => reject(err));
			} catch (err) {
				reject(err);
			}
		});
	}

	async executeCommandInBackground(
		podName: string,
		command: string[],
	): Promise<void> {
		return new Promise(async (resolve, reject) => {
			const stdout = new Writable({ write: (c, e, cb) => cb() });
			const stderr = new Writable({ write: (c, e, cb) => cb() });
			const stdin = new Readable({ read() { this.push(null); } });

			try {
				// Wrap command in nohup to keep it running in background
				const backgroundCommand = [
					"/bin/bash",
					"-c",
					`nohup ${command.join(" ")} > /tmp/run.log 2>&1 &`
				];

				await this.exec.exec(
					"loom-workspaces",
					podName,
					"workspace",
					backgroundCommand,
					stdout,
					stderr,
					stdin,
					false,
				);
				// Resolve immediately after triggering
				resolve();
			} catch (err) {
				reject(err);
			}
		});
	}

	async portForward(podName: string, localPort: number, remotePort: number): Promise<void> {
		if (this.portForwards.has(podName)) {
			return;
		}
		console.log(`Port-forwarding ${podName}: ${localPort}->${remotePort}`);
		const proc = spawn("kubectl", ["port-forward", "-n", "loom-workspaces", `pod/${podName}`, `${localPort}:${remotePort}`]);

		proc.stdout.on("data", (data) => console.log(`[kubectl-pf ${podName}] ${data}`));
		proc.stderr.on("data", (data) => console.error(`[kubectl-pf ${podName}] ${data}`));

		this.portForwards.set(podName, proc);
	}

	async stopPortForward(podName: string): Promise<void> {
		const proc = this.portForwards.get(podName);
		if (proc) {
			console.log(`Stopping port-forward for ${podName}`);
			proc.kill();
			this.portForwards.delete(podName);
		}
	}

	async waitForPortOpen(podName: string, port: number, timeoutMs: number = 30000): Promise<boolean> {
		const start = Date.now();
		while (Date.now() - start < timeoutMs) {
			try {
				// Use a simple bash command to check if the port is listening
				// 'nc -z' is standard for checking port status
				await this.executeCommand(podName, ["/bin/bash", "-c", `nc -z localhost ${port}`]);
				console.log(`Port ${port} is open on pod ${podName}`);
				return true;
			} catch (e) {
				// Port not open yet, wait and retry
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		}
		console.error(`Timeout waiting for port ${port} to open on pod ${podName}`);
		return false;
	}
}


	export default new KubernetesService();