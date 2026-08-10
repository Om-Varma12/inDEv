import ollama from "ollama"
import { reactProjectStructureSystemPrompt } from "../../prompts/system/reactProjectStructure.system.js"

export const generateProjectStructure = async (userQuery: string) => {
    console.log("started call")

    const response = await ollama.chat({
        model: "minimax-m3:cloud",
        messages: [
            {
                role: 'system',
                content: reactProjectStructureSystemPrompt
            },
            {
                role: 'user',
                content: userQuery
            }
        ]
    })

    console.log("call ended")
    return response.message.content;
}