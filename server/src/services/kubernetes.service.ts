import * as k8s from "@kubernetes/client-node";
import { memoryUsage } from "node:process";

class KubernetesService{
    private kubeConfig: k8s.KubeConfig;
    private coreApi: k8s.CoreV1Api;

    constructor(){
        this.kubeConfig = new k8s.KubeConfig();

        this.kubeConfig.loadFromDefault();

        this.coreApi = this.kubeConfig.makeApiClient(k8s.CoreV1Api);
    }

    async createPod(podName: string): Promise<void> {
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

                        resources:{
                            requests: {
                                cpu: "250m",
                                memory: "512Mi",
                            },
                            limits: {
                                cpu: "1",
                                memory: "1536Mi",
                            },
                        }
                    },
                ],
            },
        };

        await this.coreApi.createNamespacedPod({
            namespace: "default",
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
                throw new Error(
                    `Pod ${podName} failed with status ${phase}`
                );
            }

            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }
}



export default new KubernetesService();