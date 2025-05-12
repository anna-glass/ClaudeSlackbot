import { Index } from '@upstash/vector'
import { embed } from 'ai'
import { openai } from '@ai-sdk/openai'
import { chunk } from 'llm-chunk'

const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
})

const embeddingModel = openai.embedding('text-embedding-3-small')

// Generate OpenAI embedding for a single text chunk
export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({ model: embeddingModel, value: text })
  return embedding
}

// Upsert multiple chunks to Upstash Vector
export async function upsertChunks(idPrefix: string, text: string, user_id: string, display_name: string, channel: string, ts: string) {
  const chunks = chunk(text, {
    maxLength: 1024,
    overlap: 128,
  })

  for (let i = 0; i < chunks.length; i++) {
    const chunkText = chunks[i]
    const vector = await generateEmbedding(chunkText)
    const chunkId = `${idPrefix}-chunk-${i}`
    await index.upsert([
      {
        id: chunkId,
        vector,
        metadata: {
          text: chunkText,
          user_id,
          display_name,
          channel,
          ts,
        },
      },
    ])
  }
}

export async function upsertSingleVector(
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

