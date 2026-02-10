# Pattern: Lazy-Load External Services

## Problem

Services that throw errors in their constructor when environment variables are missing break Next.js builds during the "Collecting page data" phase.

```
Error: CLICKATELL_API_KEY is not configured
    at new ClickatellService (...)
> Build error occurred
[Error: Failed to collect page data for /api/...]
```

## Solution

Use lazy initialization - defer env var checks until the service is actually used.

### Before (Breaks Build)

```typescript
export class ExternalService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.API_KEY || '';
    if (!this.apiKey) {
      throw new Error('API_KEY is not configured');
    }
  }

  async doSomething() {
    // uses this.apiKey
  }
}

// Singleton created at module load time - THROWS if env var missing
export const externalService = new ExternalService();
```

### After (Build-Safe)

```typescript
export class ExternalService {
  private config: { apiKey: string } | null = null;

  private getConfig() {
    if (!this.config) {
      this.config = {
        apiKey: process.env.API_KEY || '',
      };
    }
    return this.config;
  }

  isConfigured(): boolean {
    return !!process.env.API_KEY;
  }

  async doSomething() {
    const config = this.getConfig();
    if (!config.apiKey) {
      return { success: false, error: 'API_KEY is not configured' };
    }
    // uses config.apiKey
  }
}

// Singleton is safe - no env var access at module load time
export const externalService = new ExternalService();
```

## When to Use

- Any service that depends on environment variables
- Third-party API clients (Clickatell, Didit, Stripe, etc.)
- Database clients that need connection strings
- Any singleton exported from a module

## CircleTel Examples

- `lib/integrations/clickatell/sms-service.ts`
- `lib/integrations/didit/client.ts`
- `lib/payments/netcash-service.ts`

## Alternative: Proxy Pattern

For clients that need to maintain compatibility with existing code:

```typescript
let _client: AxiosInstance | null = null;

function getClient(): AxiosInstance {
  if (!_client) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error('API_KEY required');
    _client = axios.create({ headers: { 'x-api-key': apiKey } });
  }
  return _client;
}

// Proxy defers access until actually used
export const client: AxiosInstance = new Proxy({} as AxiosInstance, {
  get(_, prop) {
    return (getClient() as Record<string, unknown>)[prop as string];
  }
});
```

## Related

- [Next.js Build Optimization](https://nextjs.org/docs/app/building-your-application/deploying#static-html-export)
- Vercel environment variables are available at runtime, not always at build time
