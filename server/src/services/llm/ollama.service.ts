import ollama from "ollama";
import "dotenv/config";

import type { LLMMessage, LLMResponse } from "../../types/llm.types.js";
import { parseRobustJSON } from "../code/jsonParser.service.js";
import { JSON_PARSER } from "../../prompts/system/jsonParser.system.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const extractCodeFromResponse = (content: string): string | null => {
    // Prefer the LAST fenced code block (model may emit examples before the answer)
    const codeFenceRegex = /```[a-zA-Z0-9._-]*\s*([\s\S]*?)```/g;
    const matches = [...content.matchAll(codeFenceRegex)];
    if (matches.length > 0) {
        return matches[matches.length - 1][1].trim();
    }

    // No fence found — check if the response looks like raw source code
    const trimmed = content.trim();
    if (
        trimmed.startsWith("import ") ||
        trimmed.startsWith("export ") ||
        trimmed.startsWith("const ") ||
        trimmed.startsWith("function ") ||
        trimmed.startsWith("class ") ||
        trimmed.startsWith("/*") ||
        trimmed.startsWith("//") ||
        trimmed.startsWith(".") ||   // CSS class selectors
        trimmed.startsWith("#") ||   // CSS id selectors / shebangs
        trimmed.includes("export default")
    ) {
        return trimmed;
    }

    return null;
};

/** Run Ollama as a JSON repair engine on a raw content string. */
const ollamaLlmParse = async (content: string): Promise<LLMResponse> => {
    console.log("parsing failed, trying Ollama LLM repair");

    const response = await ollama.chat({
        model: String(process.env.OLLAMA_MODEL),
        messages: [
            { role: "system", content: JSON_PARSER },
            { role: "user",   content },
        ],
    });

    const repaired = response.message.content || "";

    try {
        const parsed = parseRobustJSON(repaired) as unknown;
        if (
            typeof parsed === "object" &&
            parsed !== null &&
            "code" in parsed &&
            typeof (parsed as Record<string, unknown>).code === "string"
        ) {
            return parsed as LLMResponse;
        }
    } catch {
        // ignore; fall through to code extraction
    }

    const rawCode = extractCodeFromResponse(repaired);
    return { code: rawCode ?? repaired };
};

// ---------------------------------------------------------------------------
// Main exported runner
// ---------------------------------------------------------------------------

export const run = async (messages: LLMMessage[]): Promise<LLMResponse> => {
    console.log("started Ollama call");

    const response = await ollama.chat({
        model: String(process.env.OLLAMA_MODEL),
        messages,
    });

    console.log("ended Ollama call");

    const content = response.message.content || "";

    let result: unknown;
    let parsedSuccessfully = false;

    // 1. Try rule-based JSON parser first (fastest, no extra call)
    try {
        result = parseRobustJSON(content);
        if (
            typeof result === "object" &&
            result !== null &&
            "code" in result &&
            typeof (result as Record<string, unknown>).code === "string"
        ) {
            parsedSuccessfully = true;
        }
    } catch {
        // Ignore — try next strategy
    }

    // 2. Try raw code / fence extraction (model returned code, not JSON)
    if (!parsedSuccessfully) {
        const rawCode = extractCodeFromResponse(content);
        if (rawCode) {
            result = { code: rawCode };
            parsedSuccessfully = true;
        }
    }

    // 3. LLM-assisted JSON repair via Ollama
    if (!parsedSuccessfully) {
        try {
            result = await ollamaLlmParse(content);
            if (
                typeof result === "object" &&
                result !== null &&
                "code" in result &&
                typeof (result as Record<string, unknown>).code === "string"
            ) {
                parsedSuccessfully = true;
            }
        } catch {
            // Ignore — fall through to final fallback
        }
    }

    // 4. Final fallback — wrap whatever we have
    if (!parsedSuccessfully) {
        result = { code: typeof result === "string" ? result : content };
    }

    return result as LLMResponse;
};