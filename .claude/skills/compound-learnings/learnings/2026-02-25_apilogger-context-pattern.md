# apiLogger Context Pattern

**Date**: 2026-02-25
**Category**: TypeScript / Logging
**Saves**: ~5 min debugging per occurrence

## Problem

The `apiLogger` in CircleTel expects a `LogContext` object as the second argument, but it's easy to accidentally pass a string:

```typescript
// ❌ WRONG - causes TypeScript error TS2345
apiLogger.error('[API] Database error:', error.message);
apiLogger.error('[API] Unexpected error:', error);
```

## Solution

Always pass context as an object with string keys:

```typescript
// ✅ CORRECT
apiLogger.error('[API] Database error', { error: error.message });
apiLogger.error('[API] Unexpected error', {
  error: error instanceof Error ? error.message : String(error)
});
```

## Logger Signature

```typescript
// From lib/logging/logger.ts
interface LogContext {
  [key: string]: unknown;
}

function log(level: LogLevel, message: string, context?: LogContext): void;
```

## Common Patterns

```typescript
// With Supabase errors
if (error) {
  apiLogger.error('[API] Query failed', { error: error.message, code: error.code });
}

// With unknown errors in catch
catch (error) {
  apiLogger.error('[API] Unexpected error', {
    error: error instanceof Error ? error.message : String(error)
  });
}

// With request context
apiLogger.info('[API] Request received', {
  userId: user.id,
  action: 'sync'
});
```

## Files Fixed in This Session

- `app/api/admin/coverage/base-stations/route.ts` (3 occurrences)

## Related

- Logger definition: `lib/logging/logger.ts`
- Similar issue found in: `app/api/mtn-wholesale/feasibility/route.ts`
