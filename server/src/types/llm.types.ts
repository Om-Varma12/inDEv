export type LLMMessage = {
    role: "user" | "system" | "assistant";
    content: string;
};