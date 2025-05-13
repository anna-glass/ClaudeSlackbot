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
  
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${answer}*`
      }
    });
  
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
  
    blocks.push({ type: "divider" });
  
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: ":speech_balloon: *Related Slack Messages*" }
    });
  
    const msg = relevantMessages[0]
    const user = formatUserTag(msg.metadata.user_id);
    const link = formatSlackLink(msg.metadata.channel, msg.metadata.ts);
    const textBlock = link
        ? `*${user}*: <${link}|View message>\n>${msg.text}`
        : `*${user}*:\n>${msg.text}`;
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: textBlock }
    });
  
    return blocks;
  }
  
  function formatUserTag(user_id?: string): string {
    if (!user_id) return "None";
    return user_id.startsWith("U") ? `<@${user_id}>` : `*${user_id}*`;
  }
  
  function formatSlackLink(channel?: string, ts?: string): string | null {
    if (!channel || !ts) return null;
    const tsLink = ts.replace('.', '');
    return `https://slack.com/archives/${channel}/p${tsLink}`;
  }
  