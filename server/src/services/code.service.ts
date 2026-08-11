import type { StructureItem } from "../types/project.types.js";
import type { LLMMessage } from "../types/llm.types.js";

import { codeGenerationPrompt } from "../prompts/system/code.system.js";
import { run } from "../services/llm/groq.service.js"

export const generateCode = async(
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

    const result = await run(msg)

    console.log(result)
}