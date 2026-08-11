import ollama from "ollama"
import { reactProjectStructureSystemPrompt } from "../../prompts/system/reactProjectStructure.system.js"
import { reactTemplate } from "../../prompts/templates/react.template.js"
import type { ProjectStructure } from "../../types/project.types.js"


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
                role: 'system',
                content: reactTemplate
            },
            {
                role: 'user',
                content: userQuery
            }
        ]
    })
    console.log("call ended")

    console.log("parsing")
    const content = response.message.content
    const projectStructure: ProjectStructure = JSON.parse(content) 
    console.log("parsing done")

    return projectStructure
}