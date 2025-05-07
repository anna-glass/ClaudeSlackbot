import { Index } from '@upstash/vector'
import { embed } from 'ai'
import { openai } from '@ai-sdk/openai'
import { chunk } from 'llm-chunk'  // Import llm-chunk

const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
})

const embeddingModel = openai.embedding('text-embedding-3-small')

// Generate OpenAI embedding for a single text chunk
async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({ model: embeddingModel, value: text })
  return embedding
}

// Upsert multiple chunks to Upstash Vector
async function upsertChunks(idPrefix: string, text: string) {
  // Chunk the input text: max 1024 chars per chunk, 128 char overlap
  const chunks = chunk(text, {
    maxLength: 1024,
    overlap: 128,
  })

  // For each chunk, generate embedding and upsert with unique ID
  for (let i = 0; i < chunks.length; i++) {
    const chunkText = chunks[i]
    const vector = await generateEmbedding(chunkText)
    const chunkId = `${idPrefix}-chunk-${i}`
    await index.upsert([{ id: chunkId, vector, metadata: { text: chunkText } }])
  }
}

// Query similar vectors
async function querySimilar(text: string, k = 4) {
  const vector = await generateEmbedding(text)
  const result = await index.query({ vector, topK: k, includeMetadata: true })
  return result
}

export { upsertChunks, querySimilar }
