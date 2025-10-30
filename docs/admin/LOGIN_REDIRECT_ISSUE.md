# Admin Login Redirect Issue

**Date**: October 30, 2025
**Status**: 🔄 In Progress
**Priority**: CRITICAL

---

## 🐛 Issue Summary

After successful login, users are redirected back to `/admin/login?redirect=/admin` instead of the admin dashboard.

### Symptoms

1. Login API returns 200 OK with success=true
2. "Welcome back!" toast appears
3. Browser redirects to `/admin`
4. Middleware immediately redirects back to `/admin/login?redirect=/admin`
5. Loop continues indefinitely

### Root Cause

The middleware cannot read the session cookies set by the login API. Even though the login API uses Supabase SSR client to set cookies, the middleware's `supabase.auth.getUser()` call returns no user.

---

## 📊 Current State

### What Works ✅

1. **Login API** - Authenticates users correctly
2. **Cookie Setting** - Cookies are being set (visible in devtools)
3. **Middleware** - Runs on every request and checks auth
4. **Audit Logging** - All login attempts logged
5. **Security** - Middleware blocks unauthenticated access

### What Doesn't Work ❌

1. **Cookie Reading** - Middleware can't read session from cookies
2. **Redirect Loop** - After login → /admin → back to login
3. **Session Persistence** - Session not recognized after login

---

## 🔍 Technical Details

### Login API (`app/api/admin/login/route.ts`)

**Current Implementation**:
```typescript
// Two clients:
const supabaseSSR = createServerClient(...) // For auth + cookies
const supabaseAdmin = await createClient() // For admin_users check

// Authentication:
const { data: authData } = await supabaseSSR.auth.signInWithPassword({
  email, password
});

// Cookies are set via setAll() callback
response.cookies.set(name, value, options);
```

**Expected Behavior**: Cookies set in Supabase format, readable by middleware

**Actual Behavior**: Cookies ARE set, but middleware can't read them

### Middleware (`middleware.ts`)

**Current Implementation**:
```typescript
const supabase = createServerClient(...)

const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  // Redirect to login
}
```

**Expected Behavior**: `getUser()` reads cookies and returns user

**Actual Behavior**: `getUser()` returns null even with valid cookies

---

## 🧪 Testing Evidence

### Server Logs

```
Admin login successful: admin@circletel.co.za (super_admin) from IP: ::1
POST /api/admin/login 200 in 1667ms
GET /admin/login?redirect=%2Fadmin 200 in 231ms
```

The `GET /admin/login?redirect=%2Fadmin` shows the middleware is redirecting back.

### Browser Cookies

Cookies ARE being set:
- Name: `sb-agyjovdugmtopasyvlng-auth-token`
- Value: JSON object with access_token, refresh_token, etc.
- Path: `/`
- Secure: false (development)
- HttpOnly: false

### Middleware Warnings

```
Using the user object as returned from supabase.auth.getSession()
or from some supabase.auth.onAuthStateChange() events could be insecure!
Use supabase.auth.getUser() instead
```

This warning still appears, suggesting somewhere `getSession()` is being used.

---

## 💡 Potential Solutions

### Solution 1: Cookie Format Mismatch

**Hypothesis**: The cookie format from login API doesn't match what middleware expects

**Test**:
```bash
node scripts/test-login-flow.js
# Check cookie header format
```

**Fix**: Ensure cookie name and format match Supabase SSR expectations

### Solution 2: Cookie Scope Issue

**Hypothesis**: Cookies not accessible across requests due to scope

**Test**: Check cookie path, domain, sameSite settings

**Fix**: Ensure cookies have:
- Path: `/`
- SameSite: `lax`
- Domain: (not set for localhost)

### Solution 3: Middleware Cookie Reading

**Hypothesis**: Middleware `createServerClient` isn't reading cookies properly

**Test**: Add logging to middleware to see what cookies it receives

**Fix**: Verify `getAll()` callback returns all cookies

###Solution 4: Session Storage Format

**Hypothesis**: Supabase expects session in specific storage format

**Test**: Compare cookie value structure with Supabase docs

**Fix**: Use Supabase's built-in session management without manual cookie setting

---

## 🔧 Recommended Next Steps

1. **Add Debug Logging**:
   - Log cookies in middleware `getAll()` callback
   - Log user result from `getUser()` call
   - Compare cookies set vs cookies read

2. **Simplify Cookie Management**:
   - Remove manual cookie.set() calls
   - Let Supabase SSR handle everything automatically
   - Ensure both login API and middleware use identical Supabase client config

3. **Test Cookie Flow**:
   ```bash
   # Terminal 1: Watch server logs
   npm run dev:memory

   # Terminal 2: Test login
   curl -v -X POST http://localhost:3002/api/admin/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@circletel.co.za","password":"admin123"}' \
     -c cookies.txt

   # Check cookies were saved
   cat cookies.txt

   # Test accessing admin with cookies
   curl -v -b cookies.txt http://localhost:3002/admin
   ```

4. **Review Supabase SSR Docs**:
   - https://supabase.com/docs/guides/auth/server-side/nextjs
   - Verify our implementation matches official patterns

---

## 📝 Files Modified (This Session)

1. **`middleware.ts`** - Changed `getSession()` to `getUser()`
2. **`app/api/admin/login/route.ts`** - Rewrote with SSR client
3. **`app/admin/login/page.tsx`** - Changed redirect from `router.push()` to `window.location.href`
4. **`app/admin/layout.tsx`** - Added forgot-password/reset-password to public routes

---

## 🚨 Known Issues

1. **Fast Refresh Errors**: Hot reload causing runtime errors
2. **Multiple Dev Servers**: Ports 3000, 3001, 3002 all occupied
3. **Strapi Submodule**: Has untracked changes

---

## 📚 Related Documentation

- **Authentication Middleware**: `docs/admin/AUTHENTICATION_MIDDLEWARE.md`
- **Login Issue Fix**: `docs/admin/LOGIN_ISSUE_FIX.md`
- **Login Audit System**: `docs/admin/LOGIN_AUDIT_LOGGING.md`

---

## 🎯 Success Criteria

Login flow should work as follows:

1. User goes to `/admin` (unauthenticated)
2. Middleware redirects to `/admin/login?redirect=/admin`
3. User enters credentials and clicks "Sign in"
4. Login API authenticates and sets session cookies
5. Browser redirects to `/admin`
6. **Middleware reads cookies, finds valid session, allows access** ← Currently failing here
7. Admin dashboard loads

---

**Last Updated**: October 30, 2025
**Author**: CircleTel Development Team
**Status**: Requires additional debugging of cookie flow
