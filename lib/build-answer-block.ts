// Helper to generate Block Kit blocks for a Claude answer with related messages
import type { NormalizedMessage } from "./find-relevant-messages";

export function buildAnswerBlocks({
    answer,
    expert,
    relevantMessages,
  }: {
    answer: string,
    expert?: string,
    relevantMessages: NormalizedMessage[]
  }) {
    const blocks: any[] = [];
  
    // Main answer section
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${answer}*`
      }
    });
  
    // Expert section (if any)
    if (expert) {
      blocks.push({
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `*Who to talk to:* ${formatUserTag(expert)}`
          }
        ]
      });
    }
  
    // Divider
    blocks.push({ type: "divider" });
  
    // Related messages header
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: ":speech_balloon: *Related Slack Messages*" }
    });
  
    // Related messages (each as a section)
    for (const msg of relevantMessages) {
      const user = formatUserTag(msg.metadata.user_id);
      const link = formatSlackLink(msg.metadata.channel, msg.metadata.ts);
      const textBlock = link
        ? `*${user}*: <${link}|View message>\n>${msg.text}`
        : `*${user}*:\n>${msg.text}`;
  
      blocks.push({
        type: "section",
        text: { type: "mrkdwn", text: textBlock }
      });
    }
  
    return blocks;
  }
  
  // Helper for Slack mention formatting
  function formatUserTag(user_id?: string): string {
    if (!user_id) return "None";
    return user_id.startsWith("U") ? `<@${user_id}>` : `*${user_id}*`;
  }
  
  function formatSlackLink(channel?: string, ts?: string): string | null {
    if (!channel || !ts) return null;
    const tsLink = ts.replace('.', '');
    return `https://slack.com/archives/${channel}/p${tsLink}`;
  }
  