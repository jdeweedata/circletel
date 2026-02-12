# Error: MTN API Anti-Bot

**ID**: ERR-008
**Category**: api
**Severity**: medium
**Occurrences**: 2
**Last Seen**: 2026-02-05

## Signature

```
MTN API 403
blocked by anti-bot
missing browser headers
Request blocked
Access denied
```

## Root Cause

MTN's coverage API has anti-bot protection that blocks requests without browser-like headers.

## Solution

Add browser-like headers to requests:

```typescript
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://www.mtn.co.za/',
  'Origin': 'https://www.mtn.co.za',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9'
}

const response = await fetch(mtnApiUrl, { headers })
```

## Prevention

1. **Use standardized headers** for all external API calls
2. **Document required headers** for each integration
3. **Test from server environment** - not just browser

## Related

- **File**: `lib/coverage/mtn-client.ts`
- **Pattern**: External API integration headers
- **Documentation**: CLAUDE.md MTN API Anti-Bot section
