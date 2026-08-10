import { generateProjectStructure } from "./llm/ollama.service.js";

export const processUserMessage = async (message: string) => {
    const projectStructure = await generateProjectStructure(message);

    return projectStructure;
}