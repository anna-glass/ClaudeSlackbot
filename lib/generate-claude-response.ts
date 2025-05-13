import Anthropic from "@anthropic-ai/sdk";
import { NormalizedMessage } from "./find-relevant-messages";

const anthropic = new Anthropic();

export async function generateClaudeResponse(
  question: string,
  relevantMessages: NormalizedMessage[],
): Promise<string> {
  const context = relevantMessages
    .map((msg, i) => {
      const display = msg.metadata.display_name || "User";
      return `(${i + 1}) ${display}: ${msg.text}`;
    })
    .join('\n');

  const userPrompt = `User question: ${question}\n\nRelevant Slack messages:\n${context}`;

  const systemPrompt = `
    You are a helpful Slack assistant. Use the following Slack messages as context to answer the user's question.
    If you need up-to-date information or can't find the answer in the contextuse web search and include sources inline in your answer.
    Respond in one concise sentence.
    `;

  const msg = await anthropic.messages.create({
    model: "claude-3-5-haiku-latest",
    max_tokens: 1000,
    temperature: 1,
    system: systemPrompt,
    messages: [
      {
        role: "user" as const,
        content: userPrompt,
      },
    ],
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
      },
    ],
  });

  return msg.content
    .map((block: any) => (block.type === "text" ? block.text : ""))
    .join("")
    .trim();
}
