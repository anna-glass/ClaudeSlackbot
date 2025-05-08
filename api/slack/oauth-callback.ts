// pages/api/slack/oauth-callback.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import { Redis } from '@upstash/redis'
import {
  sendAdminOnboardingDM,
  onboardingMessageText,
  onboardingMessageBlocks,
  oauthSuccessHtml,
} from '../../lib/admin-onboarding-dm'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('--- OAuth callback hit ---');
  if (req.method !== 'GET') {
    console.log('Wrong method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.query;
  console.log('Received code:', code);
  if (!code || typeof code !== 'string') {
    console.log('Missing code in query params:', req.query);
    return res.status(400).json({ error: 'Missing code' });
  }

  // Exchange code for access token
  const params = new URLSearchParams({
    code,
    client_id: process.env.SLACK_CLIENT_ID!,
    client_secret: process.env.SLACK_CLIENT_SECRET!,
    redirect_uri: process.env.SLACK_REDIRECT_URI!,
  });
  console.log('Exchanging code for token with params:', params.toString());

  const slackRes = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await slackRes.json();
  console.log('Slack OAuth response:', data);
  if (!data.ok) {
    console.log('Slack OAuth failed:', data.error);
    return res.status(400).json({ error: data.error || 'Slack OAuth failed' });
  }

  const workspaceName = data.team?.name || data.team_name;
  const workspaceId = data.team?.id || data.team_id;
  const accessToken =
    data.access_token ||
    data.bot?.bot_access_token ||
    data.authed_user?.access_token;
  const adminUserId = data.authed_user?.id;

  console.log('Parsed values:', { workspaceName, workspaceId, accessToken, adminUserId });

  if (!workspaceName || !workspaceId || !accessToken || !adminUserId) {
    console.log('Missing workspace, token, or admin info');
    return res.status(400).json({ error: 'Missing workspace, token, or admin info' });
  }

  // Save workspace info and admin user ID
  await redis.set(`slack:workspace:${workspaceId}`, {
    workspaceName,
    workspaceId,
    accessToken,
    adminUserId,
  });
  console.log('Saved workspace info to Redis');

  // Send onboarding DM to admin
  try {
    await sendAdminOnboardingDM({
      accessToken,
      userId: adminUserId,
      text: onboardingMessageText,
      blocks: onboardingMessageBlocks,
    });
    console.log('Sent onboarding DM to admin:', adminUserId);
  } catch (error: any) {
    console.error('Failed to send Slack DM:', error.message);
  }

  // Show success HTML
  console.log('Sending success HTML');
  res.status(200).send(oauthSuccessHtml);
}
