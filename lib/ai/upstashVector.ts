import { Index } from '@upstash/vector'

// Configure Upstash Vector client
const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
})

// Chunking logic: split on period
function generateChunks(input: string): string[] {
  return input
    .trim()
    .split('.')
    .filter(i => i !== '')
}

// Upsert
export async function upsertEmbedding(
  resourceId: string, 
  content: string, 
  workspaceId: string, 
  metadata: Record<string, any> = {}
) {
  const chunks = generateChunks(content);
  const toUpsert = chunks.map((chunk, i) => ({
    id: `${resourceId}-${i}`,
    data: chunk,
    metadata: {
      workspaceId,
      resourceId,
      content: chunk,
      ...metadata, // Spread additional metadata
    },
  }));
  await index.upsert(toUpsert);
}


// Query
export async function findRelevantContent(query: string, k = 4) {
  const result = await index.query({
    data: query, // Again, using the data field instead of vector field
    topK: k,
    includeMetadata: true, // Fetch metadata as well
  })

  return result
}