// lastIngestStore.ts

import { Redis } from "@upstash/redis";

// Initialize Upstash Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function setLastIngestTimestamp(
  workspaceId: string,
  timestamp: string | number,
  channelId?: string
): Promise<void> {
  const key = channelId
    ? `last_ingest:${workspaceId}:${channelId}`
    : `last_ingest:${workspaceId}`;
  await redis.set(key, timestamp);
}

export async function getLastIngestTimestamp(
  workspaceId: string,
  channelId?: string
): Promise<string | null> {
  const key = channelId
    ? `last_ingest:${workspaceId}:${channelId}`
    : `last_ingest:${workspaceId}`;
  const result = await redis.get<string>(key);
  return result ?? null;
}
