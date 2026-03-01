# Type Guards for Optional/Nested Properties

**Trigger**: Accessing optional or nested properties from API responses, JSONB columns, or external data
**Source**: 3+ sessions (inngest-parallel-providers, cpq-wizard-patterns, apilogger-context)

## Pattern

Always use explicit type guards when accessing:
- Optional properties (`obj?.prop`)
- Nested arrays that might be undefined
- JSONB fields with unknown structure
- External API responses

## DO

```typescript
// Arrays from optional sources
const services = Array.isArray(provider?.services) ? provider.services : [];
const is5gAvailable = services.some(
  (s: { type?: string; available?: boolean }) => s?.type === '5g' && s?.available === true
);

// JSONB optional fields
const discount = pricing?.total_discount_percent ?? 0;
{discount > 0 && <DiscountBadge />}

// Unknown errors in catch
catch (error) {
  const message = error instanceof Error ? error.message : String(error);
}

// Logger context (must be object)
apiLogger.error('[API] Failed', { error: error.message });
```

## DON'T

```typescript
// ❌ Unsafe optional chaining on arrays
const is5g = provider?.services?.some(s => s.type === '5g');

// ❌ Truthy check without nullish coalescing
{pricing.discount > 0 && ...}  // Fails if pricing is undefined

// ❌ String as logger context
apiLogger.error('[API] Failed:', error.message);

// ❌ Set spread without Array.from (needs downlevelIteration)
new Set([...prev, newItem])
```

## Common Patterns

| Situation | Guard Pattern |
|-----------|--------------|
| Optional array | `Array.isArray(x) ? x : []` |
| Optional number | `value ?? 0` |
| Optional string | `value ?? ''` |
| Unknown error | `error instanceof Error ? error.message : String(error)` |
| Set iteration | `new Set([...Array.from(prev), newItem])` |

## Why This Matters

- Runtime errors from API variance
- TypeScript errors (TS2345) from wrong types
- Silent failures when data structure changes
