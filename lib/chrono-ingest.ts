import { client } from "./slack-utils";
import { upsertEmbedding } from "./ai/upstashVector";
import { getLastIngestTimestamp, setLastIngestTimestamp } from "../lib/get-last-ingest";

export async function chronoIngest(workspaceId: string, channelId: string) {
  // 1. Get last ingest timestamp
  const lastTs = await getLastIngestTimestamp(workspaceId, channelId);
  const oldest = lastTs ?? "0";

  // 2. Fetch only new messages
  let cursor: string | undefined = undefined;
  let maxTs = oldest;

  do {
    const res = await client.conversations.history({
      channel: channelId,
      oldest,
      cursor,
      limit: 1000,
    });

    for (const message of res.messages ?? []) {
      if (message.text && message.ts && message.ts > oldest) {
        await upsertEmbedding(
          message.ts,
          message.text,
          workspaceId,
          {
            user: message.user,
            channel: channelId,
            thread_ts: message.thread_ts,
            timestamp: message.ts,
          }
        );
        if (message.ts > maxTs) maxTs = message.ts;
      }
    }

    cursor = res.response_metadata?.next_cursor;
  } while (cursor);

  // 3. Update last ingest timestamp
  if (maxTs !== oldest) {
    await setLastIngestTimestamp(workspaceId, maxTs, channelId);
  }
}
