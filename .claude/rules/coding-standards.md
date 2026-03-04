Rule: coding-standards
Loaded by: CLAUDE.md
Scope: TypeScript patterns, Supabase clients, Next.js 15, Inngest, debugging

---

## Next.js 15 API Routes (REQUIRED)

```typescript
// ✅ CORRECT: Async params
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  // ...
}
```

## Supabase Clients

```typescript
// Server (API routes) - Service role
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()

// Client (components) - Anon key + RLS
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
```

## Webhook Signature Verification

```typescript
import crypto from 'crypto'

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}
```

## Inngest Function Structure

```typescript
export const myFunction = inngest.createFunction(
  {
    id: 'my-function',           // kebab-case
    name: 'My Function',         // Human readable
    retries: 3,
    cancelOn: [{ event: 'my/event.cancelled', match: 'data.id' }],
  },
  { event: 'my/event.requested' },
  async ({ event, step }) => {
    try {
      // Steps here...
    } catch (error) {
      // CRITICAL: Always send failure event
      await step.run('send-failure-event', async () => {
        await inngest.send({ name: 'my/event.failed', data: { error: error.message } });
      });
      throw error;
    }
  }
);
```

### Inngest Step Naming
- Use **kebab-case**: `update-status`, `send-completion-event`
- Be **descriptive**: `parallel-provider-checks` not `step-2`
- Include **action**: `persist-results`, `validate-input`

### Parallel Provider Checks

```typescript
// CRITICAL: Order matters - index positions must match destructuring
const [result1, result2, result3] = await Promise.allSettled([
  checkProvider1(coords),  // Index 0
  checkProvider2(coords),  // Index 1
  checkProvider3(coords),  // Index 2
]);
```

## Common Debugging Patterns

### Build-Time Errors from External Services

Services that throw in constructor when env vars missing break Next.js builds:

```typescript
// ❌ BAD: Throws at module load
constructor() { if (!process.env.API_KEY) throw new Error('Missing'); }

// ✅ GOOD: Lazy-load, check at runtime
private getConfig() {
  if (!this.config) this.config = { apiKey: process.env.API_KEY || '' };
  return this.config;
}
```

### External URL Redirects

Next.js `redirect()` in Server Components doesn't work for external URLs with query params:

```typescript
// app/api/redirect/[ref]/route.ts
return NextResponse.redirect(externalUrl); // Works for external URLs
```

### Infinite Loading States

```typescript
// ✅ ALWAYS use try/catch/finally
useEffect(() => {
  const callback = async () => {
    try {
      const data = await fetchData()
      setState(data)
    } catch (error) {
      console.error('Failed:', error)
      setState(null)
    } finally {
      setLoading(false) // Always executes
    }
  }
  onAuthStateChange(callback)
}, [])
```

### MTN API Anti-Bot Headers

```typescript
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Referer': 'https://www.mtn.co.za/',
  'Origin': 'https://www.mtn.co.za'
}
```

## Template

**Inngest Template**: `.claude/templates/inngest-function.ts.template`
