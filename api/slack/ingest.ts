import { ingestSlack } from '../../lib/ingestSlack';
import { getSlackToken } from '../../lib/slackTokenStore';

export const POST = async (request: Request): Promise<Response> => {
  try {
    const body = await request.json();
    const { workspaceId } = body;

    if (!workspaceId) {
      return Response.json({ error: 'Missing workspaceId parameter' }, { status: 400 });
    }

    // Get the access token from Redis
    const accessToken = await getSlackToken(workspaceId);
    
    if (!accessToken) {
      return Response.json({ error: 'No access token found for this workspace' }, { status: 404 });
    }

    // Perform the ingestion
    await ingestSlack(accessToken);
    
    return Response.json({ success: true, message: 'Slack workspace ingested successfully' });
  } catch (err) {
    console.error('Error during ingestion:', err);
    return Response.json(
      { error: 'Error during ingestion', details: (err as Error).message },
      { status: 500 }
    );
  }
}; 