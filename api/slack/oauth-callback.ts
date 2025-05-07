import { storeSlackToken } from '../../lib/slackTokenStore';

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID!;
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET!;
const SLACK_REDIRECT_URI = process.env.SLACK_REDIRECT_URI!;

export const GET = async (request: Request): Promise<Response> => {
    console.log('OAuth callback invoked');
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (!code) {
    console.error('Missing code parameter from Slack');
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
    console.error('Slack OAuth failed', tokenData);
    return Response.json({ error: 'Slack OAuth failed', details: tokenData }, { status: 400 });
  }

  const accessToken = tokenData.access_token;
  const workspaceId = tokenData.team?.id;

  if (!accessToken) {
    console.error('Missing access token from Slack response');
    return Response.json({ error: 'Missing access token from Slack response' }, { status: 400 });
  }

  if (!workspaceId) {
    console.error('Missing workspace ID from Slack response');
    return Response.json({ error: 'Missing workspace ID from Slack response' }, { status: 400 });
  }

  console.log('Slackbot installed... about to store token!');

  try {
    // Store the access token in Redis
    await storeSlackToken(workspaceId, accessToken);
    console.log('Slackbot installed and token stored successfully!');
    return new Response('Slackbot installed and token stored successfully!', { status: 200 });
  } catch (err) {
    return Response.json(
      { error: 'Error storing access token', details: (err as Error).message },
      { status: 500 }
    );
  }
};
