import type { ProjectStructure, StructureItem } from "../types/project.types.js";
import type { LLMMessage } from "../types/llm.types.js";

import { codeGenerationPrompt } from "../prompts/system/code.system.js";
import { run } from "../services/llm/groq.service.js"


import { writeProjectFile, createDirectory } from "./filesystem.service.js";

export const generateCode = async(
    plan: ProjectStructure,
    projectName: string
) => {

    for(const item of plan.structure){
        if(item.type == 'file'){
            const code = await generateFile(item);
            await writeProjectFile(projectName + '/' + item.path, code);
        }
        else if(item.type == 'folder'){
            await createDirectory(projectName + '/' + item.path);
        }
    } 
}


export const generateFile = async(
    file: StructureItem
) => {
    console.log(`generating code for ${file['path']}`)

    const msg: LLMMessage[] = [
        {
            role: 'system',
            content: codeGenerationPrompt
        },
        {
            role: 'user',
            content: JSON.stringify(file)
        }
    ]

    const code = await run(msg)

    return code;
}