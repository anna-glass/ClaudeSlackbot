'use server'

import { z } from 'zod'
import { upsertEmbedding } from '../ai/upstashVector'
import { client } from '../slack-utils'

// A simple schema for incoming resource content
const NewResourceSchema = z.object({
  content: z.string().min(1),
})

// Server action to parse the input and upsert to the index
export async function createResource(input: { content: string }) {
  const { content } = NewResourceSchema.parse(input)

  // Get workspace ID from Slack API
  const authInfo = await client.auth.test()
  const workspaceId = authInfo.team_id ?? ''

  // Generate a random ID
  const resourceId = crypto.randomUUID()

  // Upsert the chunks/embeddings to Upstash Vector
  await upsertEmbedding(resourceId, content, workspaceId, {})

  return `Resource ${resourceId} created and embedded.`
}