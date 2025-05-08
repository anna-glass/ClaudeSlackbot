// /pages/api/ingest-public-channels-job.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import { ingestPublicChannels } from '../../lib/ingest-public-channels'
import { Receiver } from "@upstash/qstash"

// --- Slack DM helper ---
async function sendAdminStatusDM({
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
  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: userId,
        text,
        ...(blocks ? { blocks } : {}),
      }),
    });

    const data = await response.json();
    if (!data.ok) {
      throw new Error(`Failed to send admin DM: ${data.error}`);
    }
    return data;
  } catch (err) {
    console.error('Error sending admin DM:', err);
    // Don't throw, just log
  }
}

// --- QStash signature verification ---
const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // QStash signature verification (security)
  const signature = req.headers["upstash-signature"] as string
  const rawBody = JSON.stringify(req.body)
  const isValid = await receiver.verify({
    signature,
    body: rawBody,
  })
  if (!isValid) {
    console.warn("Invalid QStash signature")
    return res.status(401).json({ error: "Invalid QStash signature" })
  }

  const { adminUserId } = req.body as { adminUserId?: string }

  if (adminUserId) {
    // Notify admin that the job is starting
    sendAdminStatusDM({
      accessToken: process.env.SLACK_BOT_TOKEN!,
      userId: adminUserId,
      text: "🚀 Ingest job has started.",
    })
  }

  try {
    await ingestPublicChannels();

    if (adminUserId) {
      sendAdminStatusDM({
        accessToken: process.env.SLACK_BOT_TOKEN!,
        userId: adminUserId,
        text: "✅ Ingest job completed successfully!",
      })
    }

    return res.status(200).json({ success: true })
  } catch (err: any) {
    if (adminUserId) {
      sendAdminStatusDM({
        accessToken: process.env.SLACK_BOT_TOKEN!,
        userId: adminUserId,
        text: `❌ Ingest job failed: ${err.message || 'Unknown error'}`,
      })
    }
    console.error('Ingest job failed:', err)
    return res.status(500).json({ error: err.message || 'Unknown error' })
  }
}
