import { WebClient } from '@slack/web-api'
import { upsertChunks } from './chunk-embed-and-upsert'
import { ConversationsListResponse, ConversationsHistoryResponse, ConversationsRepliesResponse } from '@slack/web-api'
import { getDisplayName } from './get-display-name'

const slackToken = process.env.SLACK_BOT_TOKEN!
const client = new WebClient(slackToken)

// Simple in-memory cache for display names
const displayNameCache = new Map<string, string>();

async function getCachedDisplayName(userId: string): Promise<string> {
  if (displayNameCache.has(userId)) {
    return displayNameCache.get(userId)!;
  }
  const name = await getDisplayName(userId);
  displayNameCache.set(userId, name);
  return name;
}

// Ingest a thread as a single chunk (concatenated messages)
async function ingestThread(channelId: string, thread_ts: string, channelName: string) {
  let cursor: string | undefined = undefined
  let threadMessages: any[] = []

  do {
    const replies: ConversationsRepliesResponse = await client.conversations.replies({
      channel: channelId,
      ts: thread_ts,
      cursor,
      limit: 1000,
    })

    if (replies.messages) {
      for (const msg of replies.messages) {
        if (
          msg.type === 'message' &&
          msg.text &&
          typeof msg.user === 'string'
        ) {
          const displayName = await getCachedDisplayName(msg.user)
          if (displayName.toLowerCase() !== 'slate-prod') {
            threadMessages.push({
              user: msg.user,
              displayName,
              text: msg.text,
              ts: msg.ts,
            });
          }
        }
      }
    }
    cursor = replies.response_metadata?.next_cursor
  } while (cursor)

  if (threadMessages.length > 0) {
    // Concatenate all thread messages into one chunk, optionally with author
    const threadText = threadMessages
      .map(msg => `${msg.displayName}: ${msg.text}`)
      .join('\n');

    // Use the thread_ts as the unique ID for the thread
    await upsertChunks(
      `${channelId}-thread-${thread_ts}`,
      threadText,
      threadMessages[0].user,
      threadMessages[0].displayName,
      channelName,
      thread_ts
    );
  }
}

export async function ingestPublicChannels() {
  // 1. List all public channels
  let cursor: string | undefined = undefined
  let channels: any[] = []
  do {
    const res: ConversationsListResponse = await client.conversations.list({
      types: 'public_channel',
      limit: 1000,
      cursor,
    })
    if (res.channels) {
      channels.push(...res.channels)
    }
    cursor = res.response_metadata?.next_cursor
  } while (cursor)

  for (const channel of channels) {
    // skip archived channels
    if (channel.is_archived) {
      console.log(`Skipping archived channel: ${channel.name} (${channel.id})`);
      continue;
    }
    // 2. Join channel
    try {
      console.log(`Attempting to join channel: ${channel.name} (${channel.id})`)
      await client.conversations.join({ channel: channel.id })
      console.log(`Joined channel: ${channel.name} (${channel.id})`)
    } catch (e) {
      // Ignore errors if already a member or cannot join
    }

    // 3. Fetch channel history (paginated)
    let historyCursor: string | undefined = undefined
    do {
      const history: ConversationsHistoryResponse = await client.conversations.history({
        channel: channel.id,
        limit: 1000,
        cursor: historyCursor,
      })
      if (history.messages) {
        for (const msg of history.messages) {
          if (
            msg.type === 'message' &&
            msg.text &&
            typeof msg.user === 'string'
          ) {
            const displayName = await getCachedDisplayName(msg.user)
            if (msg.type === 'message' && !msg.subtype) {
              if (!msg.thread_ts || msg.thread_ts !== msg.ts) {
                await upsertChunks(
                `${channel.id}-${msg.ts}`,
                msg.text,
                msg.user,
                displayName,
                channel.name,
                `${msg.ts}`
                );
              }

              // If this message starts a thread, ingest its replies as a single chunk
              if (
                msg.thread_ts &&
                msg.thread_ts === msg.ts &&
                msg.reply_count &&
                msg.reply_count > 0
              ) {
                await ingestThread(channel.id, msg.thread_ts, channel.name)
              }
            }
          }
        }
      }
      historyCursor = history.response_metadata?.next_cursor
    } while (historyCursor)
  }
  console.log('Ingestion finished.')
}
