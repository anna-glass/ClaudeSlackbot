import { WebClient } from '@slack/web-api';

interface SlackChannel {
  id: string;
  [key: string]: any;
}

export async function fetchAllPublicChannels(client: WebClient): Promise<SlackChannel[]> {
  const channels: SlackChannel[] = [];
  let cursor: string | undefined;
  do {
    const res = await client.conversations.list({ types: 'public_channel', cursor });
    channels.push(...(res.channels ?? []) as SlackChannel[]);
    cursor = res.response_metadata?.next_cursor;
  } while (cursor);
  return channels;
}
