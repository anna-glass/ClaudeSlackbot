import { WebClient } from '@slack/web-api'
import { upsertChunks } from './chunk-embed-and-upsert'
import { ConversationsListResponse, ConversationsHistoryResponse } from '@slack/web-api'

const slackToken = process.env.SLACK_BOT_TOKEN!
const client = new WebClient(slackToken)

const userCache: Record<string, string> = {}

async function getUsername(userId: string): Promise<string> {
  if (userCache[userId]) return userCache[userId]
  try {
    const userRes = await client.users.info({ user: userId })
    const profile = userRes.user?.profile || {}
    const username =
      profile.display_name?.trim() ||
      userRes.user?.real_name?.trim() ||
      userRes.user?.name?.trim() ||
      'unknown'
    userCache[userId] = username
    return username
  } catch (e) {
    console.error(`Failed to fetch user ${userId}:`, e)
    userCache[userId] = 'unknown'
    return 'unknown'
  }
}

export async function ingestPublicChannels() {
  // 1. List all public channels
  let cursor: string | undefined = undefined
  let channels: any[] = []
  let channelBatch = 1
  console.log('Starting to list all public channels...')
  do {
    console.log(`Fetching channel batch #${channelBatch}, cursor: ${cursor || 'none'}`)
    const res: ConversationsListResponse = await client.conversations.list({
      types: 'public_channel',
      limit: 1000,
      cursor,
    })
    if (res.channels) {
      console.log(`Fetched ${res.channels.length} channels in batch #${channelBatch}`)
      channels.push(...res.channels)
    } else {
      console.warn(`No channels found in batch #${channelBatch}`)
    }
    cursor = res.response_metadata?.next_cursor
    channelBatch++
  } while (cursor)
  console.log(`Total channels fetched: ${channels.length}`)

  for (const [i, channel] of channels.entries()) {
    console.log(`\nProcessing channel ${i + 1}/${channels.length}: ${channel.name} (${channel.id})`)
    try {
      // 2. Join the channel (if not already joined)
      try {
        await client.conversations.join({ channel: channel.id })
        console.log(`Joined channel: ${channel.name} (${channel.id})`)
      } catch (e) {
        console.warn(`Could not join channel ${channel.name} (${channel.id}):`, (e as Error).message)
        // Ignore errors if already a member or cannot join
      }

      // 3. Fetch channel history (paginated)
      let historyCursor: string | undefined = undefined
      let messageCount = 0
      let historyBatch = 1
      do {
        console.log(`  Fetching history batch #${historyBatch} for channel ${channel.name} (${channel.id}), cursor: ${historyCursor || 'none'}`)
        const history: ConversationsHistoryResponse = await client.conversations.history({
          channel: channel.id,
          limit: 1000,
          cursor: historyCursor,
        })
        if (history.messages) {
          console.log(`    Fetched ${history.messages.length} messages in batch #${historyBatch}`)
          for (const msg of history.messages) {
            if (
              msg.type === 'message' &&
              msg.text &&
              typeof msg.user === 'string'
            ) {
              console.log(`      Processing message ${msg.ts} from user ${msg.user}`);
              try {
                const username = await getUsername(msg.user);
                await upsertChunks(`${channel.id}-${msg.ts}`, msg.text, username);
                messageCount++
                console.log(`      Upserted message ${msg.ts}`);
              } catch (msgErr) {
                console.error(`      Error processing message ${msg.ts}:`, msgErr)
              }
            }
          }
        } else {
          console.warn(`    No messages found in batch #${historyBatch} for channel ${channel.name}`)
        }
        historyCursor = history.response_metadata?.next_cursor
        historyBatch++
      } while (historyCursor)
      console.log(`  Finished channel ${channel.name} (${channel.id}), total messages processed: ${messageCount}`)
    } catch (e) {
      // This will catch any error in processing this channel and allow the loop to continue
      console.error(`Error processing channel ${channel.name} (${channel.id}):`, e)
    }
  }
  console.log('Finished processing all channels.')
}
