import { client } from './slack-utils';
import { upsertEmbedding } from './ai/upstashVector';

interface SlackChannel {
  id: string;
  [key: string]: any;
}

async function fetchAllPublicChannels(): Promise<SlackChannel[]> {
  const channels: SlackChannel[] = [];
  let cursor: string | undefined;
  do {
    const res = await client.conversations.list({ types: 'public_channel', cursor });
    channels.push(...(res.channels ?? []) as SlackChannel[]);
    cursor = res.response_metadata?.next_cursor;
  } while (cursor);
  return channels;
}

async function fetchAndUpsertAllMessages() {
  // Get workspace/team ID
  const res = await client.auth.test();
  const workspaceId = res.team_id;
  
  if (!workspaceId) {
    console.error("Failed to get workspace ID");
    return;
  }
  
  const channels = await fetchAllPublicChannels();
  for (const channel of channels) {
    let cursor: string | undefined;
    do {
      const res = await client.conversations.history({ channel: channel.id, cursor });
      for (const message of res.messages ?? []) {
        if (message.text && message.ts) {
            await upsertEmbedding(
                message.ts,
                message.text,
                workspaceId,
                {
                    user: message.user,
                    channel: channel.id,
                    thread_ts: message.thread_ts,
                    timestamp: message.ts,
                }
            );
        }
      }
      cursor = res.response_metadata?.next_cursor;
    } while (cursor);
  }
}
