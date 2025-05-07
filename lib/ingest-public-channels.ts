import { WebClient } from '@slack/web-api'
import { upsertChunks } from './chunk-embed-and-upsert'

const slackToken = process.env.SLACK_BOT_TOKEN!
const client = new WebClient(slackToken)

export async function ingestPublicChannels() {
  // 1. List public channels
  let cursor: string | undefined = undefined
  let channels: any[] = []
  do {
    const res = await client.conversations.list({
      types: 'public_channel',
      limit: 1000,
      cursor,
    })
    if (res.channels) channels.push(...res.channels)
    cursor = res.response_metadata?.next_cursor
  } while (cursor)

  for (const channel of channels) {
    // 2. Join the channel (if not already joined)
    try {
      await client.conversations.join({ channel: channel.id })
    } catch (e) {
      // Ignore errors if already a member or cannot join
    }

    // 3. Fetch channel history (paginated)
    let historyCursor: string | undefined = undefined
    do {
      const history = await client.conversations.history({
        channel: channel.id,
        limit: 1000,
        cursor: historyCursor,
      })
      if (history.messages) {
        for (const msg of history.messages) {
          if (msg.type === 'message' && msg.text) {
            // 4. Upsert message using upsertChunks
            await upsertChunks(`${channel.id}-${msg.ts}`, msg.text)
          }
        }
      }
      historyCursor = history.response_metadata?.next_cursor
    } while (historyCursor)
  }
}
