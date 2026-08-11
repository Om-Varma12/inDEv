import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export const run = async(
    messages: []
) => {
    console.log("groq started")
    
    const response = groq.chat.completions.create({
        messages: messages,
        model: "qwen/qwen3.6-27b",
    })
    
    console.log("groq ended")

    return (await response).choices[0]?.message?.content || ''
}