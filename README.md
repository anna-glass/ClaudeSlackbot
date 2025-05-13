# Slackbot crawler & Claude AI
<img width="440" alt="Screenshot 2025-05-13 at 1 48 15 AM" src="https://github.com/user-attachments/assets/a1790659-81fa-4537-b65a-82250f839ae8" />

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

# Upstash Credentials (create Upstash account, make Vector & Redis databases)
QSTASH_CURRENT_SIGNING_KEY=sig-your-current-signing-key
QSTASH_NEXT_SIGNING_KEY=sig-your-next-signing-key
QSTASH_TOKEN=your-qstash-token

UPSTASH_VECTOR_REST_TOKEN=your-vector-rest-token
UPSTASH_VECTOR_REST_URL=your-vector-rest-url

UPSTASH_REDIS_REST_URL=your-redis-rest-url
UPSTASH_REDIS_REST_TOKEN=your-redis-rest-token
BASE_URL=your-base-url
```

### 6. Development & testing

- Ensure current code is pushed to main, wait for active deployment on Vercel
- Copy this link for testing the auth flow: https://slack.com/oauth/v2/authorize?client_id=8811655965175.8860842137074&scope=app_mentions:read,assistant:write,channels:history,channels:join,channels:read,chat:write,im:history,im:read,im:write,users:read&redirect_uri=https://your-domain/api/slack/oauth-callback
  - Make sure to replace the uri with https://your-domain/api/slack/oauth-callback

### 7. User flow
<img width="542" alt="Screenshot 2025-05-13 at 1 06 07 AM" src="https://github.com/user-attachments/assets/5c71d9ab-f0af-4b2a-a51b-435e6d332975" />
<img width="454" alt="Screenshot 2025-05-13 at 1 06 19 AM" src="https://github.com/user-attachments/assets/7460e6cd-edb2-43f7-a6a5-91234b506973" />
<img width="367" alt="Screenshot 2025-05-13 at 1 06 14 AM" src="https://github.com/user-attachments/assets/0b98fd50-6ec9-4e89-9796-7547f3b03b94" />
<img width="259" alt="Screenshot 2025-05-13 at 1 06 44 AM" src="https://github.com/user-attachments/assets/f4380995-dde1-4732-b802-796e294bb681" />
<img width="320" alt="Screenshot 2025-05-13 at 1 07 09 AM" src="https://github.com/user-attachments/assets/c2280a63-1e45-43f7-86c8-572262873ba1" />
<img width="440" alt="Screenshot 2025-05-13 at 1 48 15 AM" src="https://github.com/user-attachments/assets/e5ab5c8e-291d-4b6e-8ce0-3a196dd31395" />


## License

MIT
