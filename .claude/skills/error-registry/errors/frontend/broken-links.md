# Error: Broken Links

**ID**: ERR-011
**Category**: frontend
**Severity**: medium
**Occurrences**: 1
**Last Seen**: 2026-02-04

## Signature

```
404 Not Found
Page not found
Link to unimplemented route
Quick action leads to 404
Navigation to non-existent page
```

## Root Cause

Links point to routes that haven't been implemented yet. Common during incremental feature development.

## Solution

**Option 1**: Remove non-existent routes
**Option 2**: Replace with external links
**Option 3**: Implement the routes

```typescript
// Instead of broken internal link
<Link href="/dashboard/tickets">Log a Ticket</Link> // 404!

// Use external link or mailto
<a href="mailto:support@circletel.co.za">Log a Ticket</a>

// Or link to external support
<Link href="https://circletel.co.za/support">Get Help</Link>
```

## Prevention

1. **Don't link to unimplemented routes**
2. **Use placeholders** with "Coming Soon" if needed
3. **Check links** before deploying
4. **E2E tests** for critical navigation paths

## Validation Checklist

- [ ] All links work correctly
- [ ] No 404 errors
- [ ] User experience maintained
- [ ] External links open appropriately

## Related

- **Files**: `components/dashboard/QuickActionCards.tsx`
- **Pattern**: Progressive feature rollout
