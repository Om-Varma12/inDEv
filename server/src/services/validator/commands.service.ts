import kubernetesService from "../k8s/kubernetes.service.js";
import type { CommandResult } from "../../types/commands.types.js"


export async function runCommand(
    podName: string,
    command: string,
    cwd: string
): Promise<CommandResult> {
    try {
        const fullCommand = ["/bin/bash", "-c", `cd ${cwd} && ${command}; echo "EXIT_CODE:$?"`];
        const resultOutput = await kubernetesService.executeCommand(podName, fullCommand);

        const match = resultOutput.match(/EXIT_CODE:(\d+)\s*$/);
        const exitCode = match ? parseInt(match[1], 10) : 0;
        const cleanOutput = resultOutput.replace(/EXIT_CODE:\d+\s*$/, "");

        const success = exitCode === 0;

        return {
            command,
            stdout: cleanOutput,
            stderr: success ? "" : cleanOutput,
            exitCode,
            success
        };
    } catch(error: any) {
        return {
            command,
            stdout: "",
            stderr: error.message || "Failed to execute command in pod",
            exitCode: -1,
            success: false
        };
    }
}