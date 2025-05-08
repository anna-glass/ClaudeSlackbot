import Anthropic from "@anthropic-ai/sdk";
import { NormalizedMessage } from "./find-relevant-messages";

const anthropic = new Anthropic();

export async function generateResponseWithClaude(
  question: string,
  relevantMessages: NormalizedMessage[],
  expert?: string
): Promise<string> {
  const context = relevantMessages
    .map((msg, i) => `(${i + 1}) ${msg.metadata.user_id}: ${msg.text}`)
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

  const answer = msg.content
    .map((block: any) => (block.type === "text" ? block.text : ""))
    .join("")
    .trim();

    const expertTag = formatUserTag(expert);
    const expertLine = expertTag ? `*Who to talk to:* ${expertTag}\n` : "";

    return (
        `${answer}\n` +
        expertLine +
        `${formatSupportingMessages(relevantMessages)}`
    );
}

function formatUserTag(user_id?: string): string {
  if (!user_id) return "None";
  return user_id.startsWith("U") ? `<@${user_id}>` : `*${user_id}*`;
}
  
export function formatSlackLink(channel?: string, ts?: string): string | null {
    if (!channel || !ts) return null;
    const tsLink = ts.replace('.', '');
    return `https://slack.com/archives/${channel}/p${tsLink}`;
}
  
 export function formatSupportingMessages(messages: NormalizedMessage[]): string {
    if (!messages.length) return "No supporting messages found.";
    return messages
        .map(msg => {
            const user = formatUserTag(msg.metadata.user_id);
            const link = formatSlackLink(msg.metadata.channel, msg.metadata.ts);
            return link
                ? `> ${user}: <${link}|View message>\n> \`${msg.text}\``
                : `> ${user}: \`${msg.text}\``;
        })
        .join("\n");
}
  