import type { ProjectStructure, StructureItem, ModifiedFile } from "../../types/project.types.js";
import type { LLMMessage } from "../../types/llm.types.js";

import { codeGenerationPrompt, codeModificationPrompt } from "../../prompts/system/code.system.js";
import { run } from "../llm/groq.service.js"


import { writeProjectFile, createDirectory, readProjectFile } from "../filesystem.service.js";

export const generateCode = async(
    plan: ProjectStructure,
    projectName: string
) => {

    for(const item of plan.structure){
        if(item.type == 'file'){
            const code = await generateFile(item);
            await writeProjectFile(projectName + '/' + item.path, code.code);
        }
        else if(item.type == 'folder'){
            await createDirectory(projectName + '/' + item.path);
        }
    } 

    for(const item of plan.modifiedFiles){
        const code = await modifyFile(item, projectName)
        await writeProjectFile(projectName + '/' + item.path, code.code);
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


export const modifyFile = async(
    file: ModifiedFile,
    projectName: string
) => {
    console.log(`modifying file ${file.path}`)

    const msg: LLMMessage[] = [
        {
            role: 'system',
            content: codeModificationPrompt
        },
        {
            role: 'system',
            content: 'These are the initial file content: ' + await readProjectFile(`${projectName}/${file.path}`)
        },
        {
            role: 'user',
            content: JSON.stringify(file)
        }
    ]

    const code = await run(msg)

    return code;

}