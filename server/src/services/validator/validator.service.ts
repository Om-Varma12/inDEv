import { runCommand } from "./commands.service.js";

export const validate = async(
    projectPath: string
) => {
    const cmds = [
        "npx tsc --noEmit",
        "npm run lint",
        "npm run build"
    ];

    for(const cmd of cmds){
        const result = await runCommand(
            cmd,
            projectPath
        );

        if(!result.success){
            return{
                success: false,
                failedCommand: cmd,
                error: result
            };
        }
    }

    return{
        success: true
    }
}