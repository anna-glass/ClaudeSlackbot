import type { NextApiRequest, NextApiResponse } from 'next'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { code } = req.query
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing code' })
  }

  const params = new URLSearchParams({
    code,
    client_id: process.env.SLACK_CLIENT_ID!,
    client_secret: process.env.SLACK_CLIENT_SECRET!,
    redirect_uri: process.env.SLACK_REDIRECT_URI!, // Must match your Slack app settings
  })

  const slackRes = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  const data = await slackRes.json()
  if (!data.ok) {
    return res.status(400).json({ error: data.error || 'Slack OAuth failed' })
  }

  const workspaceName = data.team?.name || data.team_name
  const workspaceId = data.team?.id || data.team_id
  const accessToken = data.access_token || data.bot?.bot_access_token || data.authed_user?.access_token

  if (!workspaceName || !workspaceId || !accessToken) {
    return res.status(400).json({ error: 'Missing workspace or token info' })
  }

  await redis.set(`slack:workspace:${workspaceId}`, {
    workspaceName,
    workspaceId,
    accessToken,
  })

  console.log('redirecting to onboarding')
  
  const origin = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;
  res.redirect(302, `${origin}/onboarding?success=1`);

} 