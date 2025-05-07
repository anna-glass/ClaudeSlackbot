import { Redis } from "@upstash/redis";

// Initialize Upstash Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function storeSlackToken(
  workspaceId: string,
  accessToken: string
): Promise<void> {
  const key = `slack_token:${workspaceId}`;
  await redis.set(key, accessToken);
}

export async function getSlackToken(
  workspaceId: string
): Promise<string | null> {
  const key = `slack_token:${workspaceId}`;
  const result = await redis.get<string>(key);
  return result ?? null;
} 