import type { NextApiRequest, NextApiResponse } from 'next'
import { isValidSlackRequest } from '../../lib/slack-utils'
import { ingestPublicChannels } from '../../lib/ingest-public-channels'

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

  // Check for the "Start Ingest" button action
  const action = payload.actions?.[0]
  if (action?.action_id === 'start_ingest') {
    const userId = payload.user?.id;
  
    ingestPublicChannels()
      .then(() => {
        if (userId) {
          sendAdminStatusDM({
            accessToken: process.env.SLACK_BOT_TOKEN!,
            userId,
            text: "✅ Ingest of public channels is complete!",
          }).catch(err => {
            console.error("Failed to send completion DM:", err);
          });
        }
      })
      .catch((err) => {
        console.error("Ingest failed:", err);
        if (userId) {
          sendAdminStatusDM({
            accessToken: process.env.SLACK_BOT_TOKEN!,
            userId,
            text: `❌ Ingest failed: ${err.message || 'Unknown error'}`,
          }).catch(dmErr => {
            console.error("Failed to send error DM:", dmErr);
          });
        }
      });
  
    return res.json({
      response_type: 'ephemeral',
      text: '✅ Ingest of public channels started!',
      replace_original: false,
    });
  }
  

  // For any other action, just acknowledge
  res.status(200).end()
}

export async function sendAdminStatusDM({
  accessToken,
  userId,
  text,
  blocks,
}: {
  accessToken: string;
  userId: string;
  text: string;
  blocks?: any[];
}) {
  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      channel: userId,
      text,
      ...(blocks ? { blocks } : {}),
    })
  });

  const data = await response.json();
  if (!data.ok) {
    throw new Error(`Failed to send admin DM: ${data.error}`);
  }
  return data;
}
