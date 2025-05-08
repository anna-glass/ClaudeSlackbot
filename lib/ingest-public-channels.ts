import { WebClient } from '@slack/web-api'
import { upsertChunks } from './chunk-embed-and-upsert'
import { ConversationsListResponse, ConversationsHistoryResponse, ConversationsRepliesResponse } from '@slack/web-api'
import { getDisplayName } from './get-display-name'

const slackToken = process.env.SLACK_BOT_TOKEN!
const client = new WebClient(slackToken)

async function ingestThread(channelId: string, thread_ts: string, channelName: string) {
  let cursor: string | undefined = undefined
  do {
    const replies: ConversationsRepliesResponse = await client.conversations.replies({
      channel: channelId,
      ts: thread_ts,
      cursor,
      limit: 1000,
    })
    if (replies.messages) {
      // Skip the first message if it's the thread parent (already ingested)
      for (const [i, msg] of replies.messages.entries()) {
        if (
          msg.type === 'message' &&
          msg.text &&
          typeof msg.user === 'string' &&
          // Optionally: skip the first message if it's the parent
          (i > 0 || msg.ts !== thread_ts)
        ) {
          const displayName = await getDisplayName(msg.user)
          await upsertChunks(`${channelId}-${msg.ts}`, msg.text, msg.user, displayName, channelName, `${msg.ts}`)
        }
      }
    }
    cursor = replies.response_metadata?.next_cursor
  } while (cursor)
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
    // 2. Join channel
    try {
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
            const displayName = await getDisplayName(msg.user)
            await upsertChunks(`${channel.id}-${msg.ts}`, msg.text, msg.user, displayName, channel.name, `${msg.ts}`);
            // If this message starts a thread, ingest its replies
            if (msg.thread_ts && msg.thread_ts === msg.ts && (msg.reply_count && msg.reply_count > 0)) {
              await ingestThread(channel.id, msg.thread_ts, channel.name)
            }
          }
        }
      }
      historyCursor = history.response_metadata?.next_cursor
    } while (historyCursor)
  }
  console.log('Ingestion finished.')
}
