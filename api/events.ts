import { SlackEvent, handleSlackEvent } from "../types/slack-events";
import {
  assistantThreadMessage,
  handleNewAssistantMessage,
} from "../lib/handle-messages";
import { waitUntil } from "@vercel/functions";
import { handleNewAppMention } from "../lib/handle-app-mention";
import { verifyRequest, getBotId } from "../lib/slack-utils";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const payload = JSON.parse(rawBody);
  const requestType = payload.type as "url_verification" | "event_callback";

  if (requestType === "url_verification") {
    return new Response(payload.challenge, { status: 200 });
  }

  await verifyRequest({ requestType, request, rawBody });

  try {
    const botUserId = await getBotId();
    const event = payload.event as SlackEvent;
    
    const result = handleSlackEvent(event, botUserId);
    
    switch (result.type) {
      case 'app_mention':
        waitUntil(handleNewAppMention(result.event, botUserId));
        break;
      case 'assistant_thread_started':
        waitUntil(assistantThreadMessage(result.event));
        break;
      case 'message':
        waitUntil(handleNewAssistantMessage(result.event, botUserId));
        break;
    }

    return new Response("Success!", { status: 200 });
  } catch (error) {
    console.error("Error generating response", error);
    return new Response("Error generating response", { status: 500 });
  }
}
