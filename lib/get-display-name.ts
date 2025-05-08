import { WebClient } from '@slack/web-api'

const client = new WebClient(process.env.SLACK_BOT_TOKEN!);

export async function getDisplayName(userId: string): Promise<string> {
    try {
      const userRes = await client.users.info({ user: userId });
      const profile = userRes.user?.profile || {};
      return (
        profile.display_name?.trim() ||
        userRes.user?.real_name?.trim() ||
        userRes.user?.name?.trim() ||
        'unknown'
      );
    } catch (e) {
      console.error(`Failed to fetch display name for user ${userId}:`, e);
      return 'unknown';
    }
  }