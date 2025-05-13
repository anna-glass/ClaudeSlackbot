# Slackbot crawler & AI answers

## Features

- Anthropic Claude for responses (understanding slack context & web search)
- Crawls public channels on Slack workspace with QStash (lists channels, adds itself, and reads history with thread context)
- Puts data into Upstash Vector with OpenAI embeddings and Upstash Redis
- Pulls relevant messages and subject expert to answer user questions
- Can DM bot or tag in channels

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Create a Slack App

1. Create an app on Slack API dashboard
2. Choose "From scratch," select workspace you're testing on

### 3. Deploy your app (Vercel recommended)

1. Create Vercel project
2. Import GitHub repository (and push code to main)
3. Vercel will provide you with a production URL

### 4. Configure Slack App Settings

#### OAuth & Permissions

- Set the Redirect URL to: `https://your-vercel-domain/api/slack/oauth-callback`
- Add the following [Bot Token Scopes]:

  - `app_mentions:read`
  - `assistant:write`
  - `channels:history`
  - `channels:join`
  - `channels:read`
  - `chat:write`
  - `im:history`
  - `im:read`
  - `im:write`
  - `users:read`
 
#### App Home

- Enable Chat Tab
- Check 'allow users to send Slack commands and messages from the chat tab'

#### Event Subscriptions

- Enable Events
- Set the Request URL to: `https://your-vercel-domain/api/slack/events` (save changes)
- Under "Subscribe to bot events", add:
  - `app_mention`
  - `assistant_thread_started`
  - `message:im`
 
#### Event Subscriptions

- Install the app to your workspace and get the "Bot User OAuth Token" (anytime you uninstall & reinstall the app, this value will change)

#### Interactivity & Shortcuts

- Enable interactivity
- Set the Request URL to: https://our-vercel-domain/api/slack/interactivity

### 5. Add environment variables to Vercel project

```
# Slack Credentials (find these on the Slack API dashboard)
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_REDIRECT_URI=your-redirect-uri
SLACK_CLIENT_SECRET=your-client-secret
SLACK_CLIENT_ID=your-client-id

# Anthropic Credentials (create an Anthropic account, get API key)
ANTHROPIC_API_KEY=your-anthropic-api-key

# Upstash Credentials (create Upstash account, and Vector/Redis databases)
QSTASH_CURRENT_SIGNING_KEY=sig-your-current-signing-key
QSTASH_NEXT_SIGNING_KEY=sig-your-next-signing-key
QSTASH_TOKEN=your-qstash-token

UPSTASH_VECTOR_REST_TOKEN=your-vector-rest-token
UPSTASH_VECTOR_REST_URL=your-vector-rest-url

UPSTASH_REDIS_REST_URL=your-redis-rest-url
UPSTASH_REDIS_REST_TOKEN=your-redis-rest-token
BASE_URL=your-base-url
```

## License

MIT
