import * as k8s from "@kubernetes/client-node";
import { Readable, Writable } from "stream";

class KubernetesService{
    private kubeConfig: k8s.KubeConfig;
    private coreApi: k8s.CoreV1Api;
    private exec: k8s.Exec;

    constructor(){
        this.kubeConfig = new k8s.KubeConfig();
        this.kubeConfig.loadFromDefault();
        this.coreApi = this.kubeConfig.makeApiClient(k8s.CoreV1Api);
        this.exec = new k8s.Exec(this.kubeConfig);
    }

    async createPod(podName: string): Promise<void> {

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
                        image: "ubuntu:24.04",
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
                namespace: "default",
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
            namespace: "default",
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
            "default",
            podName,
            "workspace",
            ["/bin/bash"],
            stdout,
            stderr,
            stdin,
            true,
        );
    }
}



export default new KubernetesService();