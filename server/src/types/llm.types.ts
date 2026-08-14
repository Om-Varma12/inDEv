export type LLMMessage = {
    role: "user" | "system" | "assistant";
    content: string;
};

export type LLMResponse = {
    code: string
}