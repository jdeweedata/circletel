# Supabase Client Selection for Authentication

**Date**: 2026-03-07
**Trigger**: 401 Unauthorized on /admin/settings/finance despite user being Super Admin
**Time Saved**: 30-60 min per future occurrence

## The Problem

API route returned 401 Unauthorized even though:
- User existed in `admin_users` table
- User had `role: 'super_admin'` and correct `role_template_id`
- User was logged into the admin panel

## Root Cause

The API used `createClient()` which returns a **service role client** that:
- Uses `SUPABASE_SERVICE_ROLE_KEY`
- Does NOT read cookies
- Cannot retrieve user session via `getUser()`

When `supabase.auth.getUser()` is called on this client, it always returns `null` user.

## The Fix

Use `createClientWithSession()` for any API that needs to verify the logged-in user:

```typescript
// WRONG - service role, no session
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser(); // Always null!

// CORRECT - reads session from cookies
import { createClientWithSession } from '@/lib/supabase/server';
const supabase = await createClientWithSession();
const { data: { user } } = await supabase.auth.getUser(); // Returns logged-in user
```

## Client Selection Guide

| Client | Location | Use Case | Reads Cookies |
|--------|----------|----------|---------------|
| `createClient()` | `lib/supabase/server.ts` | Background jobs, migrations, cron, admin scripts | No (service role) |
| `createClientWithSession()` | `lib/supabase/server.ts` | User-facing APIs needing auth context | Yes |
| `createClient()` | `lib/supabase/client.ts` | Client components (browser) | Yes (browser cookies) |

## Decision Rule

**If your API route calls `supabase.auth.getUser()`, you MUST use `createClientWithSession()`.**

## Debug Flow for 401 Errors

```
401 Unauthorized
|
+-- 1. Check user exists in DB
|   SELECT * FROM admin_users WHERE email = 'user@example.com';
|
+-- 2. Check role/permissions match
|   - role_template_id matches role_templates.id?
|   - is_active = true?
|
+-- 3. Check session is being read  <-- MOST COMMON ISSUE
|   - Using createClientWithSession() not createClient()?
|   - Cookies being sent? (credentials: 'include' on client)
|
+-- 4. Check RLS policies (if applicable)
```

## Files Changed

- `app/api/admin/settings/billing/route.ts` - Changed `createClient` to `createClientWithSession`

## Related

- `.claude/rules/auth-patterns.md` - Three-context auth system
- `lib/supabase/server.ts` - Client definitions
