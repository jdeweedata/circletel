Rule: auth-patterns
Loaded by: CLAUDE.md
Scope: Three-context auth system, header+cookie checks, RBAC

---

## Three-Context System

| Context | Token Location | Database Access |
|---------|----------------|-----------------|
| **Consumer** | httpOnly cookies | RLS-protected queries |
| **Partner** | httpOnly cookies + FICA/CIPC docs | RLS-protected queries |
| **Admin** | RBAC (17 roles, 100+ permissions) | Service role bypasses RLS |

## Critical Pattern: Auth Provider Exclusions

```typescript
// CustomerAuthProvider must skip admin/partner pages
if (pathname?.startsWith('/admin') || pathname?.startsWith('/partners')) {
  setLoading(false)
  return // Don't initialize customer auth
}
```

**Why**: Mixing auth contexts causes infinite loops and 401 errors.

## Authorization Header Pattern (Fixes 401 Errors)

```typescript
// Server: Check BOTH header and cookies
const authHeader = request.headers.get('authorization')
if (authHeader?.startsWith('Bearer ')) {
  const user = await supabase.auth.getUser(authHeader.split(' ')[1])
} else {
  const session = await createClientWithSession()
}
```

**Reference**: Commit `ac642e8`

## Admin RBAC

- 17 predefined roles
- 100+ granular permissions
- Service role key bypasses RLS (use for admin operations)
- Check permissions before sensitive operations

## Partner Compliance

- FICA/CIPC document requirements (13 categories)
- See `lib/partners/compliance-requirements.ts`
- Storage bucket: `partner-compliance-documents` (private, 20MB, PDF/JPG/PNG/ZIP)

## Common Auth Errors

| Symptom | Cause | Fix |
|---------|-------|-----|
| 401 on valid session | Only checking cookies | Check header AND cookies |
| Infinite loading | Wrong auth provider context | Add pathname exclusions |
| RLS blocks query | Using anon key for admin | Use service role |

## Full Documentation

See `docs/architecture/AUTHENTICATION_SYSTEM.md`
