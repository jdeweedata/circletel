---
name: inngest-function-template
description: Create reliable Inngest functions with dual triggers, step checkpoints, and failure handling
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Inngest Function Template

Create production-ready Inngest functions following CircleTel patterns.

## When to Use

- "Create an Inngest function for X"
- "Add background job for X"
- "Migrate cron job to Inngest"
- "Add scheduled sync for X"

## Step 1: Define Event Types

Add to `lib/inngest/client.ts`:

```typescript
// Event types for [Feature]
'[feature]/[action].requested': {
  data: {
    triggered_by: 'cron' | 'manual';
    log_id?: string;
    options?: { dryRun?: boolean };
  };
};
'[feature]/[action].completed': {
  data: {
    log_id: string;
    stats: { processed: number; errors: number };
  };
};
'[feature]/[action].failed': {
  data: {
    log_id: string;
    error: string;
    attempt: number;
  };
};
```

## Step 2: Create the Function

```typescript
// lib/inngest/functions/[feature]-[action].ts
import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';

export const [feature][Action]Function = inngest.createFunction(
  {
    id: '[feature]-[action]',
    name: '[Feature] [Action]',
    retries: 3,
    cancelOn: [{ event: '[feature]/[action].cancelled', match: 'data.log_id' }],
  },
  [
    { cron: '0 22 * * *' },                    // Midnight SAST
    { event: '[feature]/[action].requested' }, // Manual trigger
  ],
  async ({ event, step }) => {
    const supabase = await createClient();
    const isCronTrigger = !event?.data?.log_id;
    const logId = event?.data?.log_id;

    try {
      // Step 1: Initialize
      await step.run('initialize', async () => {
        if (logId) {
          await supabase
            .from('[feature]_logs')
            .update({ status: 'running', started_at: new Date().toISOString() })
            .eq('id', logId);
        }
      });

      // Step 2: Fetch data (checkpointed)
      const data = await step.run('fetch-data', async () => {
        // Your fetch logic
        return fetchedData;
      });

      // Step 3: Process in batches (each batch is checkpointed)
      const batches = chunkArray(data, 50);
      for (let i = 0; i < batches.length; i++) {
        await step.run(`process-batch-${i}`, async () => {
          // Process batch
        });
      }

      // Step 4: Send completion event
      await step.run('send-completion-event', async () => {
        await inngest.send({
          name: '[feature]/[action].completed',
          data: { log_id: logId, stats: { processed: data.length, errors: 0 } },
        });
      });

      return { success: true, processed: data.length };

    } catch (error) {
      // CRITICAL: Always send failure event
      await step.run('send-failure-event', async () => {
        await inngest.send({
          name: '[feature]/[action].failed',
          data: {
            log_id: logId,
            error: error instanceof Error ? error.message : 'Unknown error',
            attempt: 1,
          },
        });
      });
      throw error; // Re-throw for Inngest retry handling
    }
  }
);
```

## Step 3: Register the Function

Add to `lib/inngest/index.ts`:

```typescript
import { [feature][Action]Function } from './functions/[feature]-[action]';

export const functions = [
  // existing functions...
  [feature][Action]Function,
];
```

## Step 4: Create Manual Trigger API

```typescript
// app/api/admin/[feature]/[action]/route.ts
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Check for already running
  const { data: running } = await supabase
    .from('[feature]_logs')
    .select('id')
    .in('status', ['pending', 'running'])
    .limit(1)
    .single();

  if (running) {
    return NextResponse.json(
      { success: false, error: 'Already in progress', log_id: running.id },
      { status: 409 }
    );
  }

  // Create log, then send event
  const { data: log } = await supabase
    .from('[feature]_logs')
    .insert({ status: 'pending', trigger_type: 'manual', triggered_by: user.id })
    .select('id')
    .single();

  await inngest.send({
    name: '[feature]/[action].requested',
    data: { triggered_by: 'manual', log_id: log.id },
  });

  return NextResponse.json({ success: true, log_id: log.id });
}
```

## Step 5: Create Status API

```typescript
// app/api/admin/[feature]/[action]/status/route.ts
export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('[feature]_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json(data);
}
```

## Step 6: Add UI Polling

```typescript
// In your admin page component
const triggerAction = async () => {
  setStatus('pending');
  const response = await fetch('/api/admin/[feature]/[action]', { method: 'POST' });
  const data = await response.json();

  if (data.success) {
    const pollInterval = setInterval(async () => {
      const statusRes = await fetch('/api/admin/[feature]/[action]/status');
      const status = await statusRes.json();

      if (status.status === 'completed' || status.status === 'failed') {
        clearInterval(pollInterval);
        if (status.status === 'completed') refreshData();
      }
    }, 2000);
  }
};
```

## Checklist

- [ ] Event types added to `lib/inngest/client.ts`
- [ ] Function created with dual triggers (cron + event)
- [ ] Steps are atomic and checkpointed
- [ ] Failure event sent in catch block
- [ ] Function registered in `lib/inngest/index.ts`
- [ ] Manual trigger API with conflict detection
- [ ] Status API for polling
- [ ] UI polling implemented
- [ ] Logs table created if needed

## Parallel Provider Checks Pattern

For functions that check multiple external APIs:

```typescript
// CRITICAL: Order matters - index positions must match destructuring
const [result1, result2, result3] = await Promise.allSettled([
  checkProvider1(coords),  // Index 0
  checkProvider2(coords),  // Index 1
  checkProvider3(coords),  // Index 2
]);

// Process with type guards
const services = Array.isArray(provider?.services) ? provider.services : [];
const isAvailable = services.some(
  (s: { type?: string }) => s?.type === 'target'
);
```

## Related Files

- `lib/inngest/client.ts` - Event types
- `lib/inngest/functions/` - Function implementations
- `lib/inngest/index.ts` - Function registry
- `supabase/migrations/` - Logs tables
