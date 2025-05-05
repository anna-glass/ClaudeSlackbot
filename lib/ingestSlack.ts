import { WebClient } from '@slack/web-api';
import { fetchAllPublicChannels } from './fetch-public-channels';
import { upsertEmbedding } from './ai/upstashVector';

export async function ingestSlack(accessToken: string) {
  const client = new WebClient(accessToken);

  const res = await client.auth.test();
  const workspaceId = res.team_id;
  if (!workspaceId) {
    throw new Error("Failed to get workspace ID");
  }

  const channels = await fetchAllPublicChannels(client);
  for (const channel of channels) {
    try {
      await client.conversations.join({ channel: channel.id });
      console.log(`Joined channel: ${channel.id}`);
    } catch (err) {
      console.log('Already in channel.');
    }
  
    let cursor: string | undefined;
    do {
      const historyRes = await client.conversations.history({ channel: channel.id, cursor });
      for (const message of historyRes.messages ?? []) {
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
      cursor = historyRes.response_metadata?.next_cursor;
    } while (cursor);
  }
}
