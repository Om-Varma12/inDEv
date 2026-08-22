import ollama from "ollama";
import "dotenv/config";

import type { LLMMessage } from "../../types/llm.types.js";
import { parseRobustJSON } from "../code/jsonParser.service.js";
import { JSON_PARSER } from "../../prompts/system/jsonParser.system.js";
import type { PlanStructure } from "../../types/project.types.js";

// ---------------------------------------------------------------------------
// Contract interface
// ---------------------------------------------------------------------------

export interface TaskContract<T> {
    validate: (parsed: unknown) => parsed is T;
    fallback: (rawContent: string) => T;
    extractRaw?: (rawContent: string) => T | null;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const extractCodeFromResponse = (content: string): string | null => {
    const codeFenceRegex = /```[a-zA-Z0-9._-]*\s*([\s\S]*?)```/g;
    const matches = [...content.matchAll(codeFenceRegex)];
    if (matches.length > 0) {
        return matches[matches.length - 1][1].trim();
    }

    const trimmed = content.trim();
    if (
        trimmed.startsWith("import ") ||
        trimmed.startsWith("export ") ||
        trimmed.startsWith("const ") ||
        trimmed.startsWith("function ") ||
        trimmed.startsWith("class ") ||
        trimmed.startsWith("/*") ||
        trimmed.startsWith("//") ||
        trimmed.startsWith(".") ||
        trimmed.startsWith("#") ||
        trimmed.includes("export default")
    ) {
        return trimmed;
    }

    return null;
};

// ---------------------------------------------------------------------------
// Built-in contracts
// ---------------------------------------------------------------------------

export const codeContract: TaskContract<{ code: string }> = {
    validate: (parsed): parsed is { code: string } =>
        typeof parsed === "object" &&
        parsed !== null &&
        "code" in parsed &&
        typeof (parsed as Record<string, unknown>).code === "string",
    fallback: (rawContent) => ({ code: rawContent }),
    extractRaw: (rawContent) => {
        const rawCode = extractCodeFromResponse(rawContent);
        return rawCode !== null ? { code: rawCode } : null;
    },
};

export const fileListContract: TaskContract<{ files: string[] }> = {
    validate: (parsed): parsed is { files: string[] } =>
        typeof parsed === "object" &&
        parsed !== null &&
        "files" in parsed &&
        Array.isArray((parsed as Record<string, unknown>).files) &&
        ((parsed as Record<string, unknown[]>).files).every((f) => typeof f === "string"),
    fallback: () => ({ files: [] }),
};

export const planContract: TaskContract<PlanStructure> = {
    validate: (parsed): parsed is PlanStructure =>
        typeof parsed === "object" &&
        parsed !== null &&
        "structure" in parsed &&
        Array.isArray((parsed as Record<string, unknown>).structure) &&
        "modifiedFiles" in parsed &&
        Array.isArray((parsed as Record<string, unknown>).modifiedFiles),
    fallback: () => ({
        structure: [],
        modifiedFiles: [],
        missingDependencies: [],
        notes: [],
    }),
};

// ---------------------------------------------------------------------------
// LLM repair pass (uses the same Ollama model)
// ---------------------------------------------------------------------------

const ollamaLlmRepair = async <T>(
    content: string,
    contract: TaskContract<T>
): Promise<T> => {
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
        if (contract.validate(parsed)) {
            return parsed;
        }
    } catch {
        // ignore; fall through
    }

    if (contract.extractRaw) {
        const raw = contract.extractRaw(repaired);
        if (raw !== null) return raw;
    }

    return contract.fallback(repaired);
};

// ---------------------------------------------------------------------------
// Main exported runner
// ---------------------------------------------------------------------------

export const run = async <T>(
    messages: LLMMessage[],
    contract: TaskContract<T>
): Promise<T> => {
    console.log("started Ollama call");

    const response = await ollama.chat({
        model: String(process.env.OLLAMA_MODEL),
        messages,
    });

    console.log("ended Ollama call");

    const content = response.message.content || "";

    // 1. Try rule-based JSON parser first (fastest, no extra call)
    try {
        const parsed = parseRobustJSON(content) as unknown;
        if (contract.validate(parsed)) {
            return parsed;
        }
    } catch {
        // Ignore — try next strategy
    }

    // 2. Try raw code / fence extraction (model returned code, not JSON)
    if (contract.extractRaw) {
        const raw = contract.extractRaw(content);
        if (raw !== null) return raw;
    }

    // 3. LLM-assisted JSON repair via Ollama
    try {
        const repaired = await ollamaLlmRepair(content, contract);
        if (contract.validate(repaired)) {
            return repaired;
        }
    } catch {
        // Ignore — fall through to final fallback
    }

    // 4. Final fallback
    return contract.fallback(content);
};
