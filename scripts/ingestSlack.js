// run with 'node scripts/ingestSlack.js'

import { fetchAndUpsertAllMessages } from '../lib/fetch-channel-messages';

fetchAndUpsertAllMessages()
  .then(() => {
    console.log("Slack messages ingested!");
    process.exit(0);
  })
  .catch(err => {
    console.error("Ingestion failed:", err);
    process.exit(1);
  });
