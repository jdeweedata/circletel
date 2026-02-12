# Error: Next.js 15 Async Params

**ID**: ERR-003
**Category**: typescript
**Severity**: critical
**Occurrences**: 3
**Last Seen**: 2026-02-10

## Signature

```
Type 'Promise<{ id: string }>' is not assignable to type '{ id: string }'
params is a Promise
Property 'id' does not exist on type 'Promise<{ id: string }>'
Cannot read property 'id' of Promise
```

## Root Cause

Next.js 15 made route params asynchronous. The old synchronous pattern no longer works:

```typescript
// OLD (breaks in Next.js 15)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params // ERROR: params is now a Promise!
}
```

## Solution

Use the new async params pattern:

```typescript
// NEW (Next.js 15 compatible)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params // Await the Promise
  // ... rest of handler
}
```

### Multiple Params

```typescript
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; slug: string }> }
) {
  const { id, slug } = await context.params
}
```

### Page Components

```typescript
// app/orders/[id]/page.tsx
export default async function OrderPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // ...
}
```

## Prevention

1. **Check all dynamic routes** when upgrading to Next.js 15
2. **Search for params patterns**:
   ```bash
   grep -r "{ params }: { params:" app/
   ```
3. **Use TypeScript strict mode** to catch these errors

## Quick Fix Script

```bash
# Find all API routes with old pattern
grep -rn "{ params }: { params:" app/api/

# Files to update (common locations):
# - app/api/[endpoint]/[id]/route.ts
# - app/api/admin/[resource]/[id]/route.ts
```

## Validation Checklist

- [ ] Type check passes: `npm run type-check`
- [ ] Build succeeds: `npm run build:memory`
- [ ] API routes work correctly
- [ ] All dynamic routes updated

## Related

- **Documentation**: Next.js 15 Migration Guide
- **Files affected**: All `app/api/**/[id]/route.ts` files
- **Pattern**: Documented in CLAUDE.md TypeScript Patterns

## Occurrences Log

| Date | File | Resolution Time |
|------|------|-----------------|
| 2026-02-10 | app/api/orders/[id]/route.ts | 5min |
| 2026-02-08 | app/api/quotes/[id]/route.ts | 5min |
| 2026-02-06 | app/api/customers/[id]/route.ts | 5min |
