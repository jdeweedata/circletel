# Rule: Always Await context.params in Next.js 15

**Derived From**: Multiple corrections during Next.js 15 upgrade
**Confidence**: high
**Applications**: 5

## The Rule

In Next.js 15+ API routes and page components, `params` is a Promise and must be awaited.

```typescript
// CORRECT
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
}
```

## Counter-Example (The Mistake)

```typescript
// WRONG - This was the old pattern
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params // ERROR in Next.js 15!
}
```

## Why This Matters

- Next.js 15 made params async for better streaming support
- Old code breaks with TypeScript error or runtime undefined
- All dynamic routes (`[id]`, `[slug]`) are affected

## Quick Detection

If you see this error:
```
Type 'Promise<{ id: string }>' is not assignable to type '{ id: string }'
```

Apply this rule immediately.

## Related

- **Error Registry**: ERR-003
- **Files Pattern**: `app/**/**/[*]/route.ts`, `app/**/**/[*]/page.tsx`

---

*Extracted from RSI correction loop - 2026-02-12*
