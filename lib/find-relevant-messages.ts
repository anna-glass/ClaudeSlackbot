import { generateEmbedding } from './chunk-embed-and-upsert'
import { Index } from '@upstash/vector'
import { generateResponseWithClaude } from './generate-answer'
import type { QueryResult } from "@upstash/vector";

type Metadata = { text: string; author: string };

const index = new Index<Metadata>({
    url: process.env.UPSTASH_VECTOR_REST_URL!,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

// returns top 2 most relevant messages from vector db
async function findRelevantMessages(question: string) {
    const embedding = await generateEmbedding(question);

    const results = await index.query({
        vector: embedding,
        topK: 2,
        includeMetadata: true
    });

    return results;
}

// returns the author with the most messages
function findSubjectExpert(searchResults: NormalizedMessage[]): string | undefined {
    const authorCounts: Record<string, number> = {};

    searchResults.forEach(result => {
    const author = result.metadata.username;
    authorCounts[author] = (authorCounts[author] || 0) + 1;
    });

    return Object.entries(authorCounts)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .map(([author]) => author)[0];
}

export async function handleUserQuestion(question: string) {
    const rawMessages = await findRelevantMessages(question);
    const relevantMessages = rawMessages.map(mapRawToNormalized);
    const expert = findSubjectExpert(relevantMessages);
    const answer = await generateResponseWithClaude(question, relevantMessages);

    return {
        answer,
        expert,
        supportingMessages: relevantMessages
    };
}

// Apparently a normalized type for downstream use is best practice
export type NormalizedMessage = {
    text: string;
    metadata: { username: string };
};
  
function mapRawToNormalized(result: QueryResult<Metadata>): NormalizedMessage {
    return {
        text: typeof result.metadata?.text === "string" ? result.metadata.text : "",
        metadata: {
        username: typeof result.metadata?.author === "string" ? result.metadata.author : "unknown",
        },
    };
}
  
