# Inngest Background Job System

CircleTel uses [Inngest](https://www.inngest.com) for reliable background job processing. This replaces the fire-and-forget approach that was causing serverless timeouts on Vercel.

## Why Inngest?

1. **Reliable Execution**: Jobs run to completion even if they take longer than Vercel's function timeout
2. **Automatic Retries**: Failed jobs are automatically retried with exponential backoff
3. **Observability**: Full visibility into job status, logs, and execution history
4. **Step Functions**: Complex workflows can be broken into steps that checkpoint progress
5. **Event-Driven**: Clean separation between triggering and execution

## Setup

### 1. Create Inngest Account

1. Go to [app.inngest.com](https://app.inngest.com)
2. Create a free account
3. Create a new app called "CircleTel"

### 2. Get API Keys

From the Inngest dashboard:
- **Event Key**: Used to send events (required in production)
- **Signing Key**: Used to verify webhook requests

### 3. Configure Environment Variables

Add to your `.env.local` and Vercel environment:

```bash
# Inngest Configuration
INNGEST_EVENT_KEY=your_event_key_here
INNGEST_SIGNING_KEY=your_signing_key_here
```

### 4. Deploy and Sync

After deploying to Vercel:

1. Go to Inngest dashboard → Apps
2. Click "Sync new app"
3. Enter your production URL: `https://circletel.co.za/api/inngest`
4. Inngest will discover and register your functions

## Functions

### competitor-scrape

Handles competitor product scraping with:
- Firecrawl LLM extraction
- Product normalization
- Database updates
- Price change detection

**Trigger**: `competitor/scrape.requested`

### competitor-price-alert

Sends notifications when significant price changes are detected.

**Trigger**: `competitor/price.alert`

### competitor-scheduled-scrape

Runs daily at 6 AM SAST to scrape all providers based on their frequency settings.

**Trigger**: Cron schedule `0 4 * * *`

## Usage

### Triggering a Scrape

```typescript
import { inngest } from '@/lib/inngest';

await inngest.send({
  name: 'competitor/scrape.requested',
  data: {
    provider_id: 'uuid',
    provider_slug: 'mtn',
    provider_name: 'MTN',
    scrape_log_id: 'uuid',
    scrape_urls: ['https://...'],
  },
});
```

### Monitoring Jobs

1. Go to Inngest dashboard
2. Click on "Runs" to see all job executions
3. Click on a run to see step-by-step execution
4. View logs, errors, and retry attempts

## Development

In development, Inngest runs in "Dev Server" mode:

1. Install Inngest CLI: `npm install -g inngest-cli`
2. Run dev server: `npx inngest-cli dev`
3. Open http://localhost:8288 to see the local dashboard

The dev server will automatically discover functions from your Next.js app.

## Troubleshooting

### Jobs Not Running

1. Check Inngest dashboard for errors
2. Verify environment variables are set
3. Ensure `/api/inngest` route is accessible
4. Check function logs for exceptions

### Timeout Issues

Inngest functions have a 2-hour timeout by default. If you need longer:
- Break work into smaller steps
- Use `step.run()` for checkpointing
- Consider batching large datasets

### Retry Behavior

Default retry configuration:
- 3 attempts total
- Exponential backoff
- Can be customized per function

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Admin UI      │────▶│   Scrape API    │────▶│    Inngest      │
│   /admin/...    │     │   /api/admin/   │     │    Cloud        │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Supabase      │◀────│   Inngest       │◀────│   /api/inngest  │
│   Database      │     │   Function      │     │   (webhook)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Cost

Inngest has a generous free tier:
- 25,000 function runs/month
- Unlimited events
- 7-day log retention

For CircleTel's competitor scraping (4 providers × 30 days = 120 runs/month), this is well within the free tier.
