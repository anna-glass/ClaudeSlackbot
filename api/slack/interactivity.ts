import type { NextApiRequest, NextApiResponse } from 'next'
import { isValidSlackRequest } from '../../lib/slack-utils'
import { Client as QStashClient } from "@upstash/qstash"

const qstash = new QStashClient({ token: process.env.QSTASH_TOKEN! })

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const buffers: Buffer[] = [];
  for await (const chunk of req) {
    buffers.push(chunk as Buffer);
  }
  const rawBody = Buffer.concat(buffers).toString();

  // Verify Slack request signature
  const valid = await isValidSlackRequest({ request: req as any, rawBody })
  if (!valid) {
    return res.status(400).send('Invalid Slack signature')
  }

  // Parse Slack payload (it's sent as application/x-www-form-urlencoded)
  const params = new URLSearchParams(rawBody)
  const payloadStr = params.get('payload')
  if (!payloadStr) {
    return res.status(400).json({ error: 'Missing payload' })
  }

  let payload: any
  try {
    payload = JSON.parse(payloadStr)
  } catch (e) {
    return res.status(400).json({ error: 'Invalid payload JSON' })
  }

  const action = payload.actions?.[0]
  if (action?.action_id === 'start_ingest') {
    // Construct your public ingest job endpoint URL
    const jobUrl = `${process.env.BASE_URL}/api/ingest-public-channels-job`

    await qstash.publishJSON({
      url: jobUrl,
      body: {
        adminUserId: payload.user.id,
      },
    })

    // Respond to Slack immediately
    return res.json({
      response_type: 'ephemeral',
      text: '✅ Ingest of public channels started!',
      replace_original: false,
    })
  }

  // For any other action, just acknowledge
  res.status(200).end()
}
