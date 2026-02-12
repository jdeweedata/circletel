# Error: Dashboard 401

**ID**: ERR-006
**Category**: auth
**Severity**: high
**Occurrences**: 3
**Last Seen**: 2026-02-09

## Signature

```
401 Unauthorized
API returns 401 even with valid session
auth header not checked
Works in browser but fails in API calls
Session exists in cookies but API rejects
```

## Root Cause

API routes only checking cookies for authentication, not the Authorization header. Some requests (especially from client-side fetch) send auth via header instead of cookies.

```typescript
// BROKEN: Only checks cookies
export async function GET(request: NextRequest) {
  const session = await createClientWithSession()
  // Misses Authorization: Bearer token from header!
}
```

## Solution

Check BOTH Authorization header AND cookies:

```typescript
export async function GET(request: NextRequest) {
  // Check Authorization header first
  const authHeader = request.headers.get('authorization')

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser(token)

    if (user) {
      // User authenticated via header
      // Continue with request...
    }
  } else {
    // Fall back to cookie-based session
    const session = await createClientWithSession()
    // Continue with request...
  }
}
```

### Utility Function

```typescript
// lib/auth/get-authenticated-user.ts
export async function getAuthenticatedUser(request: NextRequest) {
  // Try header first
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser(token)
    if (user) return { user, method: 'header' }
  }

  // Try cookies
  const session = await createClientWithSession()
  if (session.user) return { user: session.user, method: 'cookie' }

  return null
}
```

## Prevention

1. **Use utility function** for all authenticated API routes
2. **Test both auth methods** when adding new routes
3. **Document the pattern** in API route templates

## Debugging Steps

1. **Check what's being sent**:
   ```typescript
   console.log('Authorization:', request.headers.get('authorization'))
   console.log('Cookies:', request.cookies.getAll())
   ```

2. **Verify token is valid**:
   ```typescript
   const { data, error } = await supabase.auth.getUser(token)
   console.log('Token verification:', { data, error })
   ```

3. **Check client-side code**:
   ```typescript
   // Ensure token is being sent
   fetch('/api/endpoint', {
     headers: {
       'Authorization': `Bearer ${session.access_token}`
     }
   })
   ```

## Validation Checklist

- [ ] API returns 200 with valid session
- [ ] Works with header-based auth
- [ ] Works with cookie-based auth
- [ ] Unauthorized requests get 401
- [ ] Error message is clear

## Related

- **File**: `app/api/dashboard/*/route.ts`
- **Commit**: `ac642e8 - fix: Check BOTH header AND cookies in dashboard API`
- **Pattern**: CLAUDE.md Authorization Header Pattern

## Occurrences Log

| Date | Route | Resolution Time |
|------|-------|-----------------|
| 2026-02-09 | /api/dashboard/summary | 15min |
| 2026-02-07 | /api/dashboard/services | 10min |
| 2026-02-05 | /api/dashboard/billing | 15min |
