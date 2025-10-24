# Password Reset PKCE Issue - Root Cause Analysis

**Date**: 2025-10-24
**Status**: ❌ IDENTIFIED - Requires Supabase Configuration Change
**Priority**: HIGH

---

## Issue Summary

Password reset emails sent by Supabase are using PKCE flow (`?code=...` parameter), but the application cannot complete the flow because there's no `code_verifier` stored in localStorage. This results in:

```
AuthApiError: invalid request: both auth code and code verifier should be non-empty
```

---

## Root Cause

### What is PKCE?

**PKCE (Proof Key for Code Exchange)** is an OAuth 2.0 security enhancement that requires:

1. **Initiation**: App generates a random `code_verifier` and stores it in localStorage
2. **Request**: App sends a hashed version (`code_challenge`) to auth server
3. **Callback**: Auth server sends back a `code` parameter
4. **Exchange**: App exchanges the `code` + original `code_verifier` for tokens

### The Problem

When a user clicks "Forgot Password":
1. ✅ Supabase sends password reset email
2. ✅ Email contains link with `?code=404155a9-35a8-4c59-a288-e3516600370c`
3. ✅ User clicks link, lands on `/auth/reset-password?code=...`
4. ❌ App tries to call `exchangeCodeForSession(code)`
5. ❌ Supabase responds: "Where's the code_verifier?"
6. ❌ App shows: "Invalid or Expired Link"

**Why there's no code_verifier**:
- The password reset was initiated by Supabase's built-in email system
- Our app never generated or stored a code_verifier
- PKCE requires the initiating app to create the code_verifier

---

## Error Flow Visualization

```
User Action:           Supabase Sends:              App Tries:                Result:
┌─────────────┐       ┌──────────────────┐         ┌────────────────────┐   ┌─────────┐
│ Clicks      │──────▶│  Email with      │────────▶│ exchangeCodeFor    │──▶│ ERROR   │
│ "Forgot     │       │  ?code=xxx       │         │ Session(code)      │   │ 400     │
│ Password"   │       │  (PKCE flow)     │         │                    │   │         │
└─────────────┘       └──────────────────┘         │ ❌ No code_verifier│   │ Invalid │
                                                    │    in localStorage │   │ request │
                                                    └────────────────────┘   └─────────┘
```

---

## Why It Keeps Happening

We've tried many fixes, but they all miss the point:

| Attempted Fix | Why It Didn't Work |
|---------------|---------------------|
| Added PKCE handling in reset page | Can't exchange code without code_verifier |
| Used `setSession()` with hash tokens | Email doesn't send hash tokens, only `?code=` |
| Added `token_hash` verification | Email template changed, but Supabase still sends `?code=` |
| Created separate auth layout | Didn't address the PKCE configuration issue |
| Multiple Supabase client fixes | Not related to the PKCE flow problem |

---

## The Solution

### Option A: Change Supabase to Use Magic Link (RECOMMENDED)

Configure Supabase to use **implicit flow** instead of PKCE for password resets.

**Steps**:
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Find "Site URL" and "Redirect URLs" settings
3. Check if "PKCE" is enabled for password recovery
4. **Disable PKCE for password resets** OR
5. **Change flow type** to use magic link/OTP instead

This will make password reset emails send tokens in the hash fragment:
```
https://circletel-staging.vercel.app/auth/reset-password#access_token=xxx&refresh_token=yyy
```

Instead of PKCE code:
```
https://circletel-staging.vercel.app/auth/reset-password?code=xxx
```

### Option B: Implement Full PKCE Flow in App

If we want to keep PKCE:

1. Create custom password reset page that generates code_verifier
2. Store code_verifier in localStorage before sending reset email
3. Use Supabase's `resetPasswordForEmail()` method with PKCE options
4. Ensure the code_verifier persists until user clicks email link

**This is more complex** and not necessary for password resets.

---

## Configuration Check

### Current Supabase Email Template

User confirmed the template is set to:
```html
<p><a href="{{ .SiteURL }}/auth/reset-password?token_hash={{ .TokenHash }}&type=recovery">Reset Password</a></p>
```

**But**, Supabase is STILL sending `?code=` instead of `?token_hash=`.

This suggests:
1. The email template wasn't saved correctly, OR
2. Supabase Auth is configured to use PKCE flow globally, OR
3. The wrong email template is being used

---

## Next Steps

### Immediate Action Required

1. **Verify Supabase Dashboard Settings**:
   - Authentication → Email Templates → Password Recovery
   - Confirm template uses `{{ .TokenHash }}` not `{{ .Code }}`
   - Save and test

2. **Check Auth Flow Configuration**:
   - Authentication → Settings → Auth Flow
   - Look for PKCE settings
   - Disable PKCE for password recovery if enabled

3. **Test with New Reset Email**:
   - Request new password reset
   - Check email link format
   - Should see `?token_hash=` OR `#access_token=`
   - Should NOT see `?code=`

### Verification

Once fixed, password reset link should be ONE of these formats:

**Format 1 - OTP/Token Hash** (preferred):
```
https://circletel-staging.vercel.app/auth/reset-password?token_hash=xxx&type=recovery
```

**Format 2 - Magic Link/Implicit Flow**:
```
https://circletel-staging.vercel.app/auth/reset-password#access_token=xxx&refresh_token=yyy
```

**NOT Format 3 - PKCE** (current broken state):
```
https://circletel-staging.vercel.app/auth/reset-password?code=xxx  ❌
```

---

## Testing Script

After configuration change, test with this script:

```bash
# 1. Request password reset
node scripts/check-user-verification.js

# 2. Check email for link format
# Should see: ?token_hash= OR #access_token=
# Should NOT see: ?code=

# 3. Click link

# 4. Page should show password reset form (not error)

# 5. Enter new password

# 6. Should see success message
```

---

## Related Files

- `app/auth/reset-password/page.tsx:132-147` - PKCE exchange code (failing)
- `app/auth/reset-password/page.tsx:59-89` - Token hash verification (not being used)
- `app/auth/reset-password/page.tsx:92-130` - Hash fragment handling (not being used)
- `supabase/migrations/20251024000003_fix_email_verification_trigger.sql` - Email confirmation trigger
- `docs/testing/SUCCESSFUL_SIGNUP_TEST.md` - Email verification flow documentation

---

## Conclusion

The password reset flow is **failing because of a Supabase configuration mismatch**, not because of code issues. The app code is actually correct and handles all three flows (PKCE, token_hash, and implicit).

**The fix is purely configuration**: Change Supabase Auth to use OTP/Magic Link flow instead of PKCE for password resets.

---

**Tested By**: Claude Code (Playwright MCP)
**Test URL**: `https://circletel-staging.vercel.app/auth/reset-password?code=404155a9-35a8-4c59-a288-e3516600370c`
**Error**: `AuthApiError: invalid request: both auth code and code verifier should be non-empty`
**Required Action**: Supabase Dashboard configuration change
