import { client } from "../../lib/slack-utils";
import { chronoIngest } from "../../lib/chrono-ingest";

// Use Node.js serverless function instead of Edge runtime
export const config = {
  runtime: 'nodejs',
  // Increase timeout if needed for long-running processes
  maxDuration: 300 // 5 minutes
};

// Vercel cron handler
export async function GET(request: Request) {
  try {
    // Get the team/workspace ID from Slack API
    const authInfo = await client.auth.test();
    const workspaceId = authInfo.team_id;

    if (!workspaceId) {
      return new Response("Failed to get workspace ID", { status: 500 });
    }

    // Fetch all public channels in the workspace
    const allChannels = await fetchAllPublicChannels();
    
    // Process each channel
    for (const channel of allChannels) {
      if (channel.id) {
        await chronoIngest(workspaceId, channel.id);
      }
    }

    return new Response("Ingest completed successfully", { status: 200 });
  } catch (error) {
    console.error("Error during scheduled ingest:", error);
    return new Response("Error during scheduled ingest", { status: 500 });
  }
}

// Fetch all public channels
async function fetchAllPublicChannels() {
  const channels = [];
  let cursor;

  try {
    do {
      const res = await client.conversations.list({ 
        types: 'public_channel', 
        cursor 
      });
      
      channels.push(...(res.channels ?? []));
      cursor = res.response_metadata?.next_cursor;
    } while (cursor);

    return channels;
  } catch (error) {
    console.error("Error fetching channels:", error);
    throw error;
  }
} 