import { client } from "../../lib/slack-utils";
import { chronoIngest } from "../../lib/chrono-ingest";
import { fetchAllPublicChannels } from "../../lib/fetch-public-channels";

export const config = {
  maxDuration: 60
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

    const allChannels = await fetchAllPublicChannels(client);
    
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