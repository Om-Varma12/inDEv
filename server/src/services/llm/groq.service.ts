import Groq from "groq-sdk";
import type { LLMMessage } from "../../types/llm.types.js";
import "dotenv/config";

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

    const content = response.choices[0]?.message?.content || "";

    return content
        .replace(/<think>[\s\S]*?<\/think>/g, "")
        .replace(/^```(?:tsx|typescript|ts|jsx|javascript|js)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
};