import Anthropic from "@anthropic-ai/sdk";
import { NormalizedMessage } from "./find-relevant-messages";

const anthropic = new Anthropic();

export async function generateResponseWithClaude(question: string, relevantMessages: NormalizedMessage[]): Promise<string> {
    const context = relevantMessages
        .map((msg, i) => `(${i + 1}) ${msg.metadata.username}: ${msg.text}`)
        .join('\n');

    const messages = [
        {
            role: "user" as const,
            content: `User question: ${question}\n\nRelevant Slack messages:\n${context}`,
        },
    ];

    const msg = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1000,
        temperature: 1,
        system: "You are a helpful Slack assistant. Use the following Slack messages as context to answer the user's question. Reference the people who contributed if helpful.",
        messages,
    });

    const answer = msg.content
        .map((block: any) => (block.type === "text" ? block.text : ""))
        .join("")
        .trim();

    return answer || "Sorry, I couldn't generate an answer.";
}