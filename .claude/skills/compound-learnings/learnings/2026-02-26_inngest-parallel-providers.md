# Inngest Parallel Provider Checks Pattern

**Date**: 2026-02-26
**Context**: Feasibility coverage check implementation
**Files**: `lib/inngest/functions/feasibility-check.ts`

## Pattern: Resilient Parallel Provider Checks

When checking multiple external providers in parallel, use this pattern:

### 1. Promise.allSettled with Index Documentation

```typescript
// CRITICAL: Order matters - index positions must match destructuring below
const [taranaResult, mtnResult, fibreResult, dfaResult] = await Promise.allSettled([
  checkTarana(coords),  // Index 0
  checkMTN(coords),     // Index 1
  checkFibre(coords),   // Index 2
  checkDFA(coords),     // Index 3
]);
```

**Why**: `Promise.allSettled` doesn't fail fast - all checks complete even if some fail. The comment prevents future bugs when reordering.

### 2. Type-Safe Result Processing

```typescript
interface ProviderCheckResult {
  provider: string;
  technology: string;
  success: boolean;
  result?: CoverageResult;
  error?: string;
}

// Process each result safely
if (taranaResult.status === 'fulfilled') {
  results.push(taranaResult.value);
} else {
  results.push({
    provider: 'Tarana',
    technology: 'fixed_wireless',
    success: false,
    error: taranaResult.reason?.message || 'Unknown error',
  });
}
```

### 3. Type Guards for Nested Optional Properties

```typescript
// BAD - unsafe
const is5gAvailable = mtnProvider?.services?.some(
  (s) => s.type === '5g' && s.available
);

// GOOD - explicit guards
const services = Array.isArray(mtnProvider?.services) ? mtnProvider.services : [];
const is5gAvailable = services.some(
  (s: { type?: string; available?: boolean }) => s?.type === '5g' && s?.available === true
);
```

### 4. Failure Event Handling in Inngest

Always wrap the main function body in try/catch with failure event:

```typescript
export const myFunction = inngest.createFunction(
  { id: 'my-function', retries: 3 },
  { event: 'my/event.requested' },
  async ({ event, step }) => {
    try {
      // ... all steps ...
      return { success: true };
    } catch (error) {
      await step.run('send-failure-event', async () => {
        await inngest.send({
          name: 'my/event.failed',
          data: {
            id: event.data.id,
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

### 5. Consistent Result Shape

All provider checks should return the same fields for UI consistency:

```typescript
interface CoverageResult {
  technology: string;
  provider: string;
  is_feasible: boolean;
  confidence: 'high' | 'medium' | 'low';
  max_speed_mbps?: number;  // Include for all providers!
  distance_m?: number;
  signal_strength?: string;
  checked_at: string;
  error?: string;
}
```

## Anti-Patterns

1. **Don't use Promise.all** - One failure aborts all checks
2. **Don't skip index comments** - Future reordering causes silent bugs
3. **Don't access optional arrays without guards** - Runtime errors from API variance
4. **Don't forget failure events** - Leads stuck in "checking" status forever

## Time Savings

Following this pattern saves ~30 min per new Inngest function by:
- Providing copy-paste template structure
- Preventing common runtime errors
- Ensuring consistent monitoring in Inngest dashboard
