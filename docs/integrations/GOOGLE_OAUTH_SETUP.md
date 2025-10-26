# Google OAuth Setup Guide for CircleTel

This guide walks you through setting up Google OAuth authentication on the account creation page.

## 📋 Prerequisites

- Supabase Project ID: `agyjovdugmtopasyvlng`
- Supabase Service Role Key: `sb_secret_KZlUVioFZ4r8vbeOK4215g_f3tUgyoG`
- Access to Google Cloud Console
- Access to Supabase Dashboard

## 🔧 Step 1: Configure Google Cloud Console

### 1.1 Access Google Cloud Console
Go to: https://console.cloud.google.com/apis/credentials

### 1.2 Create OAuth 2.0 Client ID (if not exists)

1. Click **"Create Credentials"** → **"OAuth client ID"**
2. Select **"Web application"**
3. Name it: `CircleTel Production` (or your preferred name)

### 1.3 Add Authorized Redirect URIs

Add the following URIs:

**Supabase Callback (REQUIRED):**
```
https://agyjovdugmtopasyvlng.supabase.co/auth/v1/callback
```

**Application Callbacks:**
```
http://localhost:3006/auth/callback
http://localhost:3000/auth/callback
https://your-production-domain.com/auth/callback
```

### 1.4 Save Credentials

After creating, you'll receive:
- **Client ID** (e.g., `123456789-abc.apps.googleusercontent.com`)
- **Client Secret** (e.g., `GOCSPX-abc123...`)

⚠️ **Save these credentials securely - you'll need them in the next step!**

---

## 🔐 Step 2: Configure Supabase Authentication

### 2.1 Enable Google Provider

1. Go to: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/auth/providers
2. Find **"Google"** in the provider list
3. Toggle it **ON**
4. Enter your credentials from Step 1.4:
   - **Client ID**: `[Your Google Client ID]`
   - **Client Secret**: `[Your Google Client Secret]`
5. Click **"Save"**

### 2.2 Configure Redirect URLs

1. Go to: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/auth/url-configuration
2. Under **"Redirect URLs"**, add the following (one per line):

```
http://localhost:3006/auth/callback
http://localhost:3000/auth/callback
https://your-production-domain.com/auth/callback
```

3. Click **"Save"**

### 2.3 Verify Site URL

Ensure **"Site URL"** is set correctly:
- **Development**: `http://localhost:3006`
- **Production**: `https://your-production-domain.com`

---

## 📝 Step 3: Environment Variables

Ensure your `.env.local` file contains:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://agyjovdugmtopasyvlng.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Your Anon Key]
SUPABASE_SERVICE_ROLE_KEY=sb_secret_KZlUVioFZ4r8vbeOK4215g_f3tUgyoG

# Optional: Custom app URL (defaults to window.location.origin)
NEXT_PUBLIC_APP_URL=http://localhost:3006
```

---

## 🧪 Step 4: Test the OAuth Flow

### 4.1 Start Development Server

```bash
npm run dev:memory
```

Server should start at: http://localhost:3006

### 4.2 Navigate to Account Creation Page

Visit: http://localhost:3006/order/account

### 4.3 Click "Continue with Google"

You should see:
1. ✅ Redirect to Google OAuth consent screen
2. ✅ Sign in with your Google account
3. ✅ Grant permissions to CircleTel
4. ✅ Redirect back to: `/auth/callback`
5. ✅ Create customer record automatically
6. ✅ Final redirect to: `/order/service-address`

### 4.4 Check Browser Console

Open DevTools → Console and look for:

```
[Google OAuth] Redirect URL: http://localhost:3006/auth/callback?next=/order/service-address
[Auth Callback] Checking for hash: #access_token=...
[Auth Callback] Access token found: true
[Auth Callback] Session set successfully: true
[Auth Callback] Creating customer record for OAuth user
[Auth Callback] Customer data payload: {...}
[Auth Callback] Create customer result: { success: true, ... }
```

---

## 🔍 Troubleshooting

### Issue: "Error 400: redirect_uri_mismatch"

**Cause**: The redirect URI in your request doesn't match Google Cloud Console configuration.

**Solution**:
1. Check Google Cloud Console → Credentials → Your OAuth Client
2. Ensure this exact URL is listed: `https://agyjovdugmtopasyvlng.supabase.co/auth/v1/callback`
3. Save changes and wait 5 minutes for propagation

### Issue: "Provider not enabled"

**Cause**: Google OAuth provider not enabled in Supabase.

**Solution**:
1. Go to: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/auth/providers
2. Enable Google provider
3. Add Client ID and Client Secret
4. Save changes

### Issue: User authenticated but no customer record created

**Cause**: `/api/auth/create-customer` endpoint may have failed.

**Solution**:
1. Check browser console for errors
2. Check Network tab → `/api/auth/create-customer` request
3. Verify response: `{ success: true, customer: {...} }`
4. If failing, check database permissions (RLS policies)

### Issue: Redirect loop after OAuth

**Cause**: Callback page not handling OAuth response correctly.

**Solution**:
1. Check `app/auth/callback/page.tsx:48-126` for implicit flow handling
2. Ensure `window.location.hash` contains `access_token`
3. Verify `setSession()` call succeeds

### Issue: Customer record missing after OAuth

**Cause**: Customer creation API may not extract user metadata correctly.

**Solution**:
Check OAuth user metadata structure:
```typescript
// Google OAuth user metadata structure
session.user.user_metadata = {
  full_name: "John Doe",
  name: "John Doe",
  email: "john@example.com",
  avatar_url: "https://...",
  provider_id: "123456789",
  email_verified: true,
  phone_verified: false
}
```

The callback extracts:
- **First Name**: `full_name.split(' ')[0]` or `name.split(' ')[0]`
- **Last Name**: `full_name.split(' ').slice(1).join(' ')`
- **Email**: `session.user.email`
- **Phone**: `user_metadata.phone || user.phone` (usually empty for Google OAuth)

---

## 📊 Implementation Details

### Code Flow: Account Creation Page

**File**: `app/order/account/page.tsx:166-180`

```typescript
const handleGoogleSignIn = async () => {
  setIsGoogleLoading(true);
  try {
    const result = await signInWithGoogle();
    if (result.error) {
      toast.error(result.error);
      setIsGoogleLoading(false);
    }
    // If successful, user will be redirected to Google OAuth
  } catch (error) {
    console.error('Google sign-in error:', error);
    toast.error('Failed to sign in with Google');
    setIsGoogleLoading(false);
  }
};
```

### Code Flow: CustomerAuthService

**File**: `lib/auth/customer-auth-service.ts:242-276`

```typescript
static async signInWithGoogle(): Promise<{ error: string | null }> {
  try {
    const supabase = createClient();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const redirectUrl = `${baseUrl}/auth/callback?next=/order/service-address`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Google sign-in failed'
    };
  }
}
```

### Code Flow: Auth Callback Handler

**File**: `app/auth/callback/page.tsx:48-126`

1. **Check URL hash for access token** (implicit flow)
2. **Extract `access_token` and `refresh_token`**
3. **Set session using `supabase.auth.setSession()`**
4. **Check if customer record exists**
5. **Create customer record if missing** (via `/api/auth/create-customer`)
6. **Redirect to `next` parameter** (default: `/order/service-address`)

### Customer Record Creation

**File**: `app/auth/callback/page.tsx:86-116`

For OAuth users, the callback automatically creates a customer record with:

```typescript
{
  auth_user_id: session.user.id,
  first_name: session.user.user_metadata?.full_name?.split(' ')[0] || 'User',
  last_name: session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
  email: session.user.email,
  phone: session.user.user_metadata?.phone || '',
  account_type: 'personal'
}
```

---

## 🎯 Success Criteria

Google OAuth is working correctly when:

✅ User clicks "Continue with Google" on `/order/account`
✅ Redirects to Google OAuth consent screen
✅ After consent, redirects back to `/auth/callback`
✅ Session is established (check `supabase.auth.getSession()`)
✅ Customer record exists in `customers` table
✅ User redirects to `/order/service-address`
✅ No errors in browser console
✅ User can continue with order flow

---

## 📚 Additional Resources

- **Supabase OAuth Docs**: https://supabase.com/docs/guides/auth/social-login/auth-google
- **Google OAuth Setup**: https://support.google.com/cloud/answer/6158849
- **Next.js Authentication**: https://nextjs.org/docs/authentication

---

## 🔒 Security Notes

1. **Never commit OAuth credentials** to Git (use `.env.local`)
2. **Rotate Client Secret** if accidentally exposed
3. **Use HTTPS in production** for OAuth callbacks
4. **Validate redirect URLs** in both Google Console and Supabase
5. **Monitor OAuth usage** in Google Cloud Console quotas

---

## 📞 Support

If you encounter issues not covered in this guide:

1. Check Supabase logs: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/logs/auth-logs
2. Check browser DevTools → Console for errors
3. Verify all redirect URLs match exactly (case-sensitive)
4. Ensure Google Cloud Console credentials are active
5. Wait 5-10 minutes after configuration changes for propagation

---

**Last Updated**: 2025-10-26
**Version**: 1.0
**Status**: ✅ Production Ready
