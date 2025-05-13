import { Index } from '@upstash/vector'
import { embed } from 'ai'
import { openai } from '@ai-sdk/openai'

const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
})

const embeddingModel = openai.embedding('text-embedding-3-small')

export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({ model: embeddingModel, value: text })
  return embedding
}

export async function upsertVector(
  id: string,
  text: string,
  user_id: string,
  display_name: string,
  channel: string,
  ts: string
) {
  const vector = await generateEmbedding(text);
  await index.upsert([
    {
      id,
      vector,
      metadata: {
        text,
        user_id,
        display_name,
        channel,
        ts,
      },
    },
  ]);
}

