import { GenericMessageEvent } from '@slack/types';
import { client, getThread } from './slack-utils';
import { handleUserQuestion } from './find-relevant-messages';

export interface AssistantThreadStartedEvent {
  type: "assistant_thread_started";
  assistant_thread: {
    channel_id: string;
    thread_ts: string;
  };
}

export async function assistantThreadMessage(
  event: AssistantThreadStartedEvent,
) {
  const { channel_id, thread_ts } = event.assistant_thread;
  console.log(`Thread started: ${channel_id} ${thread_ts}`);

  await client.chat.postMessage({
    channel: channel_id,
    thread_ts: thread_ts,
    text: "Hi, I'm an AI assistant built by Slate! Ask me a question, and I'll find you someone to talk to and related messages.",
  });
}

export async function handleNewAssistantMessage(
  event: GenericMessageEvent,
  botUserId: string,
) {
  // don't respond to bots or if not in a thread
  if (
    event.bot_id ||
    event.bot_id === botUserId ||
    event.bot_profile ||
    !event.thread_ts
  ) {
    return;
  }

  const thread_ts = event.thread_ts || event.ts;
  const { channel } = event;

  try {
    const messages = await getThread(channel, thread_ts, botUserId);
    const lastUserMessage = [...messages].reverse().find(m => m.role === "user");

    if (!lastUserMessage) {
      await postReply(channel, thread_ts, "I didn't get that question - let me know if I can help with anything!");
      return;
    }

    const answer = await handleUserQuestion(lastUserMessage.content.toString());
    await postReply(channel, thread_ts, answer);

  } catch (error) {
    console.error("Error handling assistant message:", error);
    await postReply(channel, thread_ts, "Sorry, I got lost in the sauce - please try again!");
  }
}

async function postReply(channel: string, thread_ts: string | undefined, text: string) {
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
