# Error: Vercel Timeout

**ID**: ERR-007
**Category**: build
**Severity**: medium
**Occurrences**: 2
**Last Seen**: 2026-02-07

## Signature

```
504 Gateway Timeout
maxDuration exceeded
Vercel function timeout
FUNCTION_INVOCATION_TIMEOUT
Request timed out after 10s
```

## Root Cause

API route takes longer than default Vercel timeout (10s for hobby, 60s for pro). Common for routes that:
- Make multiple database queries
- Call external APIs
- Process large datasets

## Solution

Add route to `vercel.json` with `maxDuration`:

```json
// vercel.json
{
  "functions": {
    "app/api/quotes/[id]/route.ts": {
      "maxDuration": 60
    },
    "app/api/admin/reports/route.ts": {
      "maxDuration": 120
    }
  }
}
```

### Common Routes Needing Extended Duration

| Route | Duration | Reason |
|-------|----------|--------|
| `/api/quotes/[id]` | 60s | Multiple DB queries |
| `/api/admin/reports` | 120s | Large data aggregation |
| `/api/coverage/check` | 30s | External API calls |
| `/api/cron/*` | 300s | Background processing |

## Prevention

1. **Add to vercel.json proactively** for slow routes
2. **Optimize queries** to reduce execution time
3. **Use streaming** for long-running operations
4. **Background jobs** for very long tasks

## Validation Checklist

- [ ] Route responds without timeout
- [ ] vercel.json updated
- [ ] Tested on Vercel (not just local)
- [ ] Duration is sufficient but not excessive

## Related

- **File**: `vercel.json`
- **Commits**: `df9cf64-c6df5d4`
- **Documentation**: CLAUDE.md Quick Reference
