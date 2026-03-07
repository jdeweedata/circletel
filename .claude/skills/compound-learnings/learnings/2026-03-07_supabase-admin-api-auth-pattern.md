# Supabase Admin API Auth Pattern

**Date**: 2026-03-07
**Trigger**: 401 Unauthorized errors on admin API routes
**Time Saved**: ~30 min per occurrence

## Problem

Admin API routes returning 401 Unauthorized even when user is logged in.

## Root Cause

Using `createClient()` instead of `createClientWithSession()` for authentication:

```typescript
// WRONG - createClient() uses service role, doesn't read cookies
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser(); // Always null!
```

`createClient()` creates a service role client with `persistSession: false` — it never reads auth cookies, so `getUser()` returns null.

## Correct Pattern

```typescript
import { createClientWithSession, createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  // 1. Use session client for authentication (reads cookies)
  const supabase = await createClientWithSession();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Use service role client for admin check (bypasses RLS)
  const supabaseAdmin = await createClient();
  const { data: adminUser } = await supabaseAdmin
    .from('admin_users')
    .select('id, role')
    .eq('id', user.id)        // Use user.id, NOT email
    .eq('is_active', true)    // Always check is_active
    .single();

  if (!adminUser) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  // 3. Use supabaseAdmin for all database queries (bypasses RLS)
  const { data } = await supabaseAdmin.from('some_table').select('*');

  return NextResponse.json({ data });
}
```

## Key Points

| Step | Client | Why |
|------|--------|-----|
| Auth check | `createClientWithSession()` | Reads httpOnly cookies |
| Admin lookup | `createClient()` | Service role bypasses RLS on admin_users |
| DB queries | `createClient()` | Service role for admin operations |

## Common Mistakes

| Wrong | Correct |
|-------|---------|
| `createClient()` for auth | `createClientWithSession()` for auth |
| `.eq('email', user.email)` | `.eq('id', user.id)` |
| Missing `is_active` check | Always add `.eq('is_active', true)` |
| Using session client for queries | Use service role for admin DB operations |

## Files Following This Pattern

- `app/api/admin/integrations/route.ts` (reference implementation)
- `app/api/ruijie/devices/route.ts`
- `app/api/ruijie/sync/route.ts`
- `app/api/ruijie/tunnel/route.ts`

## Symptoms

- 401 Unauthorized on admin routes
- Works in Postman with bearer token but fails in browser
- User is clearly logged in but API rejects requests
