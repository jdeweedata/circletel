# Pattern: Structured Logging in API Routes

**Category**: API
**Complexity**: Low
**Reuse Frequency**: Daily

---

## Context

Use this pattern whenever creating or modifying API routes. All routes should use structured logging instead of console.log/error/warn.

## Problem

Console statements in production code:
- Expose internal state to browser console
- Create log noise that makes debugging harder
- Have no log levels or filtering capability
- Cannot be disabled in production

## Solution

Use domain-specific loggers from `lib/logging/logger.ts` that provide structured, filterable logs with appropriate log levels.

### Code Example

```typescript
// Before (the problem)
export async function POST(request: NextRequest) {
  try {
    console.log('Processing request:', body);
    const result = await processData(body);
    console.log('Success:', result);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// After (the pattern)
import { apiLogger } from '@/lib/logging/logger';

export async function POST(request: NextRequest) {
  try {
    apiLogger.info('Processing request', { endpoint: '/api/example', body });
    const result = await processData(body);
    apiLogger.info('Request processed successfully', { resultId: result.id });
    return NextResponse.json({ success: true });
  } catch (error) {
    apiLogger.error('Error processing request', { error, endpoint: '/api/example' });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

### Step-by-Step

1. Import the appropriate logger for your domain
2. Replace `console.log` with `logger.info` or `logger.debug`
3. Replace `console.error` with `logger.error`
4. Replace `console.warn` with `logger.warn`
5. Add context object as second parameter

## Logger Selection Guide

| Route Path | Logger | Import |
|------------|--------|--------|
| `app/api/admin/**` | `apiLogger` | `import { apiLogger } from '@/lib/logging/logger'` |
| `app/api/cron/**` | `cronLogger` | `import { cronLogger } from '@/lib/logging/logger'` |
| `app/api/payments/**` | `paymentLogger` | `import { paymentLogger } from '@/lib/logging/logger'` |
| `app/api/webhooks/**` | `webhookLogger` | `import { webhookLogger } from '@/lib/logging/logger'` |
| `app/api/dashboard/**` | `apiLogger` | `import { apiLogger } from '@/lib/logging/logger'` |
| Auth-related | `authLogger` | `import { authLogger } from '@/lib/logging/logger'` |
| Billing/invoices | `billingLogger` | `import { billingLogger } from '@/lib/logging/logger'` |
| Zoho integration | `zohoLogger` | `import { zohoLogger } from '@/lib/logging/logger'` |
| Coverage checks | `coverageLogger` | `import { coverageLogger } from '@/lib/logging/logger'` |
| Notifications | `notificationLogger` | `import { notificationLogger } from '@/lib/logging/logger'` |
| KYC/verification | `kycLogger` | `import { kycLogger } from '@/lib/logging/logger'` |
| Service activation | `activationLogger` | `import { activationLogger } from '@/lib/logging/logger'` |

## Log Levels

| Level | When to Use | Example |
|-------|-------------|---------|
| `error` | Operation failed, needs attention | DB errors, API failures |
| `warn` | Unexpected but handled | Retry needed, deprecated usage |
| `info` | Normal operations | Request received, completed |
| `debug` | Detailed diagnostics | Full payloads, intermediate states |

## Context Object Best Practices

```typescript
// Good: Structured context with relevant data
apiLogger.error('Failed to update customer', {
  customerId: customer.id,
  operation: 'update',
  error: error.message,
  endpoint: '/api/customers/[id]'
});

// Bad: Unstructured or missing context
apiLogger.error('Error', error);  // No context
apiLogger.error('Error: ' + error.message);  // String concatenation
```

## Trade-offs

### Pros
- Filterable by domain in log aggregator
- Consistent format across codebase
- Environment-aware (silent in production console)
- Structured data for analytics

### Cons
- Extra import statement
- Slightly more verbose than console.log
- Need to choose correct logger

## CircleTel Examples

| File | Usage |
|------|-------|
| `app/api/admin/orders/[id]/route.ts` | `apiLogger` for order operations |
| `app/api/cron/generate-invoices/route.ts` | `cronLogger` for scheduled billing |
| `app/api/webhooks/netcash/paynow/route.ts` | `webhookLogger` for payment callbacks |

## Anti-Patterns

**DON'T do this:**
```typescript
// No logger selection - use console
console.log('Request received');

// Wrong logger for domain
import { cronLogger } from '@/lib/logging/logger';
// In: app/api/payments/route.ts (should use paymentLogger)

// Logging sensitive data
apiLogger.info('User login', { password: user.password }); // NEVER log passwords
```

**DO this instead:**
```typescript
// Correct logger for domain
import { paymentLogger } from '@/lib/logging/logger';

// Structured with safe data
paymentLogger.info('Payment initiated', {
  orderId: order.id,
  amount: order.total,
  method: 'card' // Not card number!
});
```

## Related Patterns

- [Error Handling](./error-handling.md) - How to structure catch blocks
- [API Response Format](./api-responses.md) - Standard response structure

## References

- `lib/logging/logger.ts` - Logger implementations
- `CLAUDE.md` - Logging guidelines in project instructions

---

**Created**: 2026-02-09
**Last Updated**: 2026-02-09
**Author**: Claude Code (DEBT-001 migration)
