import { generateEmbedding } from './chunk-embed-and-upsert'
import { Index } from '@upstash/vector'
import { generateClaudeResponse } from './generate-claude-response'
import type { QueryResult } from "@upstash/vector";
import { buildAnswerBlocks } from './build-answer-block';

type Metadata = { text: string; user_id: string; display_name: string; channel: string; ts: string };

const index = new Index<Metadata>({
    url: process.env.UPSTASH_VECTOR_REST_URL!,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

export async function handleUserQuestion(question: string) {
    const rawMessages = await findRelevantMessages(question);
    const relevantMessages = rawMessages.map(mapRawToNormalized);
    const expert = findSubjectExpert(relevantMessages);
    const answer = await generateClaudeResponse(question, relevantMessages);
    const answerBlocks = buildAnswerBlocks({ answer, expert, relevantMessages });
    return answerBlocks;
}

async function findRelevantMessages(question: string) {
    const embedding = await generateEmbedding(question);

    const results = await index.query({
        vector: embedding,
        topK: 5,
        includeMetadata: true
    });

    return results.filter(result => typeof result.score === "number" && result.score >= 0.5);
}

function findSubjectExpert(searchResults: NormalizedMessage[]): string | undefined {
    const authorCounts: Record<string, number> = {};

    searchResults.forEach(result => { 
    const author = result.metadata.user_id;
    authorCounts[author] = (authorCounts[author] || 0) + 1;
    });

    return Object.entries(authorCounts)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .map(([author]) => author)[0];
}

export type NormalizedMessage = {
    text: string;
    metadata: { user_id: string; display_name: string; channel: string; ts: string };
};
  
function mapRawToNormalized(result: QueryResult<Metadata>): NormalizedMessage {
    return {
        text: typeof result.metadata?.text === "string" ? result.metadata.text : "",
        metadata: {
            user_id: typeof result.metadata?.user_id === "string" ? result.metadata.user_id : "unknown",
            display_name: typeof result.metadata?.display_name === "string" ? result.metadata.display_name : "unknown",
            channel: typeof result.metadata?.channel === "string" ? result.metadata.channel : "unknown",
            ts: typeof result.metadata?.ts === "string" ? result.metadata.ts : "unknown",
        },
    };
}
  
