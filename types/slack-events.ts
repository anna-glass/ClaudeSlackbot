export type SlackEvent = { 
  type: string; 
  [key: string]: any 
};

export function handleSlackEvent(event: SlackEvent, botUserId: string): 
  | { type: 'app_mention'; event: SlackEvent }
  | { type: 'assistant_thread_started'; event: SlackEvent }
  | { type: 'message'; event: SlackEvent }
  | { type: 'unknown'; event: SlackEvent }
{
  if (event.type === 'app_mention') {
    return { type: 'app_mention', event };
  } 
  
  if (event.type === 'assistant_thread_started') {
    return { type: 'assistant_thread_started', event };
  }
  
  if (
    event.type === 'message' &&
    !event.subtype &&
    event.channel_type === 'im' &&
    !event.bot_id &&
    !event.bot_profile &&
    event.bot_id !== botUserId
  ) {
    return { type: 'message', event };
  }
  
  return { type: 'unknown', event };
}
