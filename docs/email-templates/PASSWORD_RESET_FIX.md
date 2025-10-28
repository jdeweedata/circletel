# Password Reset Email - Fix Guide

## 🚨 **Issue Detected**

Password reset emails are being sent, but the callback URL has issues:

**Current Error:**
```
URL: https://circletel-staging.vercel.app/auth/callback.#error=access_denied&error_code=otp_expired
Error: OTP expired
Result: 404 page
```

**Problems:**
1. ❌ URL has period before hash: `/auth/callback.#` (malformed)
2. ❌ Wrong redirect target (should be `/auth/reset-password`)
3. ❌ Token expired (timing or link age issue)

---

## ✅ **Solution**

### **Step 1: Configure Supabase Redirect URLs**

1. **Go to:** https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/settings/auth

2. **Scroll to:** "URL Configuration" section

3. **Set Redirect URLs:**

**Site URL:**
```
https://circletel-staging.vercel.app
```

**Redirect URLs (add both):**
```
https://circletel-staging.vercel.app/auth/callback
https://circletel-staging.vercel.app/auth/reset-password
https://circletel-staging.vercel.app/**
```

4. **Save changes**

---

### **Step 2: Configure Password Reset Redirect**

Still in Supabase Auth settings:

1. **Find:** "Email Auth" section
2. **Look for:** "Password Recovery"
3. **Set Redirect To:**
```
https://circletel-staging.vercel.app/auth/reset-password
```

4. **Save changes**

---

### **Step 3: Update Email Template Link Format**

The period in the URL might be coming from the email template. Let's verify:

**Check Supabase Email Template:**
1. Go to: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/auth/templates
2. Click: "Reset password" template
3. **Look for:** `{{ .ConfirmationURL }}`
4. **Ensure it's exactly:** `{{ .ConfirmationURL }}` (no periods, no extra characters)

**Correct format:**
```html
<a href="{{ .ConfirmationURL }}" style="...">
  Reset My Password
</a>
```

**Incorrect format (if you see this, fix it):**
```html
<a href="{{ .ConfirmationURL }}." style="...">  <!-- ❌ Extra period -->
  Reset My Password
</a>
```

5. **Save template**

---

### **Step 4: Test with Fresh Reset Link**

The "OTP expired" error means the link is too old. Test with a new one:

1. **Go to:** https://circletel-staging.vercel.app/auth/forgot-password
2. **Enter email:** jeffrey.de.wee@circletel.co.za
3. **Click:** "Send Reset Link"
4. **Check inbox** for new email
5. **Click link immediately** (within 1 hour)

**Expected Flow:**
```
Click reset link
  ↓
Supabase validates token
  ↓
Redirect to /auth/reset-password
  ↓
User enters new password
  ↓
Password updated
  ↓
Redirect to login or dashboard
```

---

## 🔍 **Verify Current Configuration**

Run this command to check Supabase redirect URLs:

```bash
# Check what Supabase has configured
curl "https://agyjovdugmtopasyvlng.supabase.co/auth/v1/settings" \
  -H "apikey: sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7" | jq
```

Look for:
- `"site_url"` - should be staging URL
- `"redirect_urls"` - should include callback and reset-password URLs

---

## 🧪 **Test Complete Flow**

### **Test 1: Request Password Reset**

```bash
# 1. Request password reset via API (to test token generation)
curl -X POST "https://agyjovdugmtopasyvlng.supabase.co/auth/v1/recover" \
  -H "apikey: sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jeffrey.de.wee@circletel.co.za"
  }'

# 2. Check response (should be 200 OK)
# 3. Check email inbox
# 4. Click link within 1 hour
```

### **Test 2: Verify Email Content**

When you receive the email, check:
- ✅ **From:** CircleTel <noreply@notifications.circletelsa.co.za>
- ✅ **Subject:** Reset Your CircleTel Password
- ✅ **Link format:** `https://circletel-staging.vercel.app/auth/callback?token_hash=...&type=recovery`
- ✅ **No period before hash or query params**

### **Test 3: Click Link and Verify Redirect**

After clicking link:
1. **Should redirect to:** `/auth/reset-password`
2. **Should see:** Password reset form
3. **Should be able to:** Enter new password
4. **Should redirect to:** Dashboard or login page

---

## 🛠️ **Common Issues**

### **Issue 1: "OTP Expired"**

**Causes:**
- Link is older than 1 hour
- System clock mismatch
- Token already used

**Fix:**
- Request new password reset
- Click link within 1 hour
- Use link only once

### **Issue 2: Malformed URL (period in URL)**

**Causes:**
- Extra character in email template
- URL encoding issue
- Template variable formatting

**Fix:**
- Check email template in Supabase
- Ensure `{{ .ConfirmationURL }}` has no extra characters
- Re-upload template if needed

### **Issue 3: 404 on Callback**

**Causes:**
- Wrong redirect URL
- Password reset not configured to use reset-password page
- URL pattern mismatch

**Fix:**
- Add `/auth/reset-password` to redirect URLs
- Configure password recovery redirect
- Add wildcard `/**` to allowed URLs

### **Issue 4: Token Not Valid**

**Causes:**
- Used same link twice
- Link expired before clicking
- Supabase configuration issue

**Fix:**
- Request fresh reset link
- Click immediately after receiving
- Verify Supabase auth settings

---

## 📋 **Checklist**

Before testing again:

- [ ] ✅ Supabase Site URL set to staging URL
- [ ] ✅ Redirect URLs include `/auth/callback`
- [ ] ✅ Redirect URLs include `/auth/reset-password`
- [ ] ✅ Redirect URLs include `/**` wildcard
- [ ] ✅ Password recovery redirect set to `/auth/reset-password`
- [ ] ✅ Email template has no extra periods in `{{ .ConfirmationURL }}`
- [ ] ✅ Email template saved in Supabase
- [ ] ✅ Request NEW password reset (don't reuse old link)
- [ ] ✅ Click link within 1 hour of receiving
- [ ] ✅ Verify redirect goes to password reset form

---

## 🎯 **Expected Behavior After Fix**

### **Email Sent:**
```
From: CircleTel <noreply@notifications.circletelsa.co.za>
Subject: Reset Your CircleTel Password
Link: https://circletel-staging.vercel.app/auth/callback?token_hash=abc123&type=recovery
```

### **Click Link:**
```
1. Supabase validates token
2. Redirects to: /auth/reset-password?token_hash=abc123
3. Password reset form appears
4. User enters new password
5. Password updated successfully
6. Redirects to login or dashboard
```

---

## 📞 **Still Having Issues?**

If you've followed all steps and still see errors:

1. **Check Supabase Logs:**
   - https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/logs/auth-logs
   - Look for failed password reset attempts

2. **Check Resend Logs:**
   - https://resend.com/emails
   - Verify email was delivered
   - Check if link format looks correct

3. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for JavaScript errors
   - Check network tab for failed requests

4. **Test with Different Browser:**
   - Sometimes browser caching causes issues
   - Try incognito/private mode

---

**Last Updated:** 2025-10-28
**Issue:** Password reset link malformed with period and OTP expired
**Fix:** Configure Supabase redirect URLs + verify email template
