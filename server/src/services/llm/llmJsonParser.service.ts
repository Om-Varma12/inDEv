import { JSON_PARSER } from "../../prompts/system/jsonParser.system.js"
import type { LLMMessage } from "../../types/llm.types.js"
import { run } from "./groq.service.js"

export const llmParse = async(
    code: string
) => {

    console.log("parsing failed, trying LLM")

    const msg: LLMMessage[] = [
        {
            role: 'system',
            content: JSON_PARSER
        },
        {
            role: 'user',
            content: code
        }
    ]

    const result = await run(msg);
    
    return result;
}