import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 })
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
    return NextResponse.json({ error: data.error || 'Slack OAuth failed' }, { status: 400 })
  }

  const workspaceName = data.team?.name || data.team_name
  const workspaceId = data.team?.id || data.team_id
  const accessToken = data.access_token || data.bot?.bot_access_token || data.authed_user?.access_token

  if (!workspaceName || !workspaceId || !accessToken) {
    return NextResponse.json({ error: 'Missing workspace or token info' }, { status: 400 })
  }

  await redis.set(`slack:workspace:${workspaceId}`, {
    workspaceName,
    workspaceId,
    accessToken,
  })

  // Redirect to onboarding or success page
  return NextResponse.redirect('/onboarding?success=1')
}
