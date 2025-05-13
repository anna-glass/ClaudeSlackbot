export async function sendAdminOnboardingDM({
    accessToken,
    userId,
  }: {
    accessToken: string;
    userId: string;
  }) {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: userId,
        blocks: onboardingMessageBlocks
      })
    });
  
    const data = await response.json();
    if (!data.ok) {
      throw new Error(`Failed to send DM: ${data.error}`);
    }
    return data;
  }
  
  export const oauthSuccessHtml = `
  <html>
    <head>
      <title>Slack App Installed</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        body {
          background: #f9fafb;
          font-family: 'Inter', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .card {
          background: #fff;
          border-radius: 1rem;
          box-shadow: 0 4px 24px rgba(0,0,0,0.07);
          padding: 2.5rem 2rem;
          text-align: center;
          max-width: 400px;
        }
        h2 {
          color: #22c55e;
          margin-bottom: 1rem;
          font-size: 2rem;
        }
        p {
          color: #334155;
          margin-bottom: 0;
          font-size: 1.1rem;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>✅ Slack app installed!</h2>
        <p>You can now return to Slack.<br>Check your DMs for next steps.</p>
      </div>
    </body>
  </html>
`;

const onboardingMessageBlocks = [
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "👋 Thanks for installing the app! Click below to start your Slack ingest."
    }
  },
  {
    "type": "actions",
    "elements": [
      {
        "type": "button",
        "text": {
          "type": "plain_text",
          "text": "Start Ingest"
        },
        "action_id": "start_ingest"
      }
    ]
  }
];
