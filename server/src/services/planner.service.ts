import { run } from "./llm/ollama.service.js";

import { reactProjectStructureSystemPrompt } from "../prompts/system/reactProjectStructure.system.js";
import { reactTemplate } from "../prompts/templates/react.template.js";
import { userUiPrompt } from "../prompts/user.prompt.js";
import type { ProjectStructure } from "../types/project.types.js";

export const generateProjectStructure = async(
    userQuery: string
) => {
    console.log("planning started")

    const msg = [
        {
            role: 'system',
            content: reactProjectStructureSystemPrompt
        },
        {
            role: 'system',
            content: reactTemplate
        },
        {
            role: 'system',
            content: userUiPrompt
        },
        {
            role: 'user',
            content: userQuery
        },
    ]
    const result = await run(msg)

    const projectStructure: ProjectStructure = JSON.parse(result) 

    return projectStructure
}