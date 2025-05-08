import Anthropic from "@anthropic-ai/sdk";
import { NormalizedMessage } from "./find-relevant-messages";

const anthropic = new Anthropic();

export async function generateResponseWithClaude(
  question: string,
  relevantMessages: NormalizedMessage[],
  expert?: string
): Promise<string> {
  // Build context for Claude using display names only
  const context = relevantMessages
    .map((msg, i) => {
      const display = msg.metadata.display_name || "User";
      return `(${i + 1}) ${display}: ${msg.text}`;
    })
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
    system:
      "You are a helpful Slack assistant. Use the following Slack messages as context to answer the user's question. Respond in one concise sentence.",
    messages,
  });

  // Return just the plain answer string
  return msg.content
    .map((block: any) => (block.type === "text" ? block.text : ""))
    .join("")
    .trim();
}
