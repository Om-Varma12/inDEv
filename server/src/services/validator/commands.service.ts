import { exec } from "node:child_process";
import { promisify } from "node:util";

import type { CommandResult } from "../../types/commands.types.js"


const execAsync = promisify(exec);


export async function runCommand(
    command: string,
    cwd: string
): Promise<CommandResult> {
    try{
        const { stdout, stderr } = await execAsync(command, {
            cwd,
        });
        
        return{
            command,
            stdout,
            stderr,
            exitCode: 0,
            success: true
        };
    }
    catch(error: any){
        return{
            command,
            stdout: error.stdout ?? "",
            stderr: error.stderr ?? "",
            exitCode: error.code ?? "",
            success: false
        };
    }
}