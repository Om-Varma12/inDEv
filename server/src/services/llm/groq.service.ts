import Groq from "groq-sdk";
import type { LLMMessage } from "../../types/llm.types.js";


const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export const run = async (
    messages: LLMMessage[]
) => {

    const response = await groq.chat.completions.create({
        messages,
        model: "qwen/qwen3.6-27b",
    });

    return response.choices[0]?.message?.content || "";
};