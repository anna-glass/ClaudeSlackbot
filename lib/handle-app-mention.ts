import type { AppMentionEvent } from "@slack/types";
import { client } from "./slack-utils";
import { handleUserQuestion } from "./find-relevant-messages";

export async function handleNewAppMention(event: AppMentionEvent, botUserId: string) {
  // don't respond to bots
  if (event.bot_id || event.bot_id === botUserId || event.bot_profile) {
    return;
  }

  const thread_ts = event.thread_ts || event.ts;
  const { channel } = event;

  try {
    const question = event.text.replace(`<@${botUserId}>`, "").trim();
    if (!question) {
      await postReply(channel, thread_ts, [], "I didn't get that question - let me know if I can help with anything!");
      return;
    }

    const answerBlocks = await handleUserQuestion(question);
    await postReply(channel, thread_ts, answerBlocks, "");

  } catch (error) {
    console.error("Error handling app mention:", error);
    await postReply(channel, thread_ts, [], "Sorry, I got lost in the sauce - please try again!");
  }
}

async function postReply(channel: string, thread_ts: string | undefined, blocks: any[], text: string) {
  return client.chat.postMessage({
    channel,
    thread_ts: thread_ts || undefined,
    text,
    unfurl_links: false,
    blocks: [{
      type: "section",
      text: { type: "mrkdwn", text }
    }]
  });
}
