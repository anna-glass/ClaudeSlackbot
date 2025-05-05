import { ingestSlack } from '../../lib/ingestSlack';

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID!;
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET!;
const SLACK_REDIRECT_URI = process.env.SLACK_REDIRECT_URI!;

export const GET = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (!code) {
    return Response.json({ error: 'Missing code parameter from Slack' }, { status: 400 });
  }

  // Exchange the code for an access token
  const tokenRes = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: SLACK_CLIENT_ID,
      client_secret: SLACK_CLIENT_SECRET,
      redirect_uri: SLACK_REDIRECT_URI,
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.ok) {
    return Response.json({ error: 'Slack OAuth failed', details: tokenData }, { status: 400 });
  }

  const accessToken = tokenData.access_token;

  if (!accessToken) {
    return Response.json({ error: 'Missing access token from Slack response' }, { status: 400 });
  }

  try {
    await ingestSlack(accessToken);
    return new Response('Slackbot installed and workspace ingested successfully!', { status: 200 });
  } catch (err) {
    return Response.json(
      { error: 'Error during ingestion', details: (err as Error).message },
      { status: 500 }
    );
  }
};
