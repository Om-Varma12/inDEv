import ollama from "ollama";

export const run = async (
    messages: {
        role: string
        content: string
    }[]
) => {
    console.log("started Ollama call");

    const response = await ollama.chat({
        model: "minimax-m3:cloud",
        messages
    });

    console.log("ended Ollama call");

    return response.message.content;
};