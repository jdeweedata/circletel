# Error: Infinite Loading State

**ID**: ERR-001
**Category**: auth
**Severity**: critical
**Occurrences**: 7
**Last Seen**: 2026-02-12

## Signature

```
Loading spinner never stops
loading stays true
setLoading never called
Dashboard shows "Loading..." indefinitely
No errors in console, no data appears
```

## Root Cause

Missing `finally` block in async auth callback. When `fetchUserData()` throws an error, `setLoading(false)` never executes because it's only in the success path.

```typescript
// BROKEN CODE
useEffect(() => {
  const callback = async () => {
    const data = await fetchUserData()
    setUser(data)
    setLoading(false) // Only runs if no error!
  }
  onAuthStateChange(callback)
}, [])
```

## Solution

```typescript
// FIXED CODE
useEffect(() => {
  const callback = async () => {
    try {
      const data = await fetchUserData()
      setUser(data)
    } catch (error) {
      console.error('Auth error:', error)
      setUser(null)
    } finally {
      setLoading(false) // Always executes
    }
  }
  onAuthStateChange(callback)
}, [])
```

## Prevention

1. **Always use try/catch/finally** for async callbacks that control loading states
2. **Put setLoading(false) in finally** - never in try block alone
3. **Add linting rule** to catch missing finally blocks in async effects

## Validation Checklist

- [ ] Dashboard loads correctly
- [ ] User data displays
- [ ] No infinite loading
- [ ] Error cases handled gracefully
- [ ] Console shows no uncaught errors

## Related

- **File**: `components/providers/CustomerAuthProvider.tsx:64-76`
- **Commit**: `24547cb - fix: Add finally block to CustomerAuthProvider callback`
- **Pattern**: `compound-learnings/learnings/patterns/async-error-handling.md`

## Occurrences Log

| Date | Context | Resolution Time |
|------|---------|-----------------|
| 2026-02-12 | Dashboard provider | 10min |
| 2026-02-10 | Customer services page | 15min |
| 2026-02-08 | Billing summary | 20min |
