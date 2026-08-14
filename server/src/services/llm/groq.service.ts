import Groq from "groq-sdk";
import type { LLMMessage } from "../../types/llm.types.js";
import "dotenv/config";

import { parseRobustJSON } from "../code/jsonParser.service.js";
import { llmParse } from "./llmJsonParser.service.js";

const keys = [
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
    process.env.GROQ_API_KEY_4,
    process.env.GROQ_API_KEY_5,
    process.env.GROQ_API_KEY_6,
].filter((key): key is string => Boolean(key));

let currentIndex = 0;

const getNextKey = () => {
    const key = keys[currentIndex]
    currentIndex = (currentIndex + 1) % keys.length

    return key;
}

export const run = async (
    messages: LLMMessage[]
) => {
    const apiKey = getNextKey();

    const groq = new Groq({
        apiKey
    });

    const response = await groq.chat.completions.create({
        messages,
        model: String(process.env.MODEL),
    });

    const content = response.choices[0]?.message?.content || "";

    let result: unknown = content;

    while(typeof result !== "string"){
        try{
            result = parseRobustJSON(String(result));
        } 
        catch{
            result = await llmParse(String(result));
        }
    }

    return result;
};