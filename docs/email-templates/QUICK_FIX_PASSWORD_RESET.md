# Quick Fix - Password Reset Email (5 Minutes)

## 🎯 **The Problem**

You clicked the password reset link and got:
- URL: `https://circletel-staging.vercel.app/auth/callback.#error=access_denied&error_code=otp_expired`
- Error: "OTP expired" + 404 page

**Two issues:**
1. Period in URL (`.#` instead of `#`)
2. Token expired (link too old or already used)

---

## ⚡ **Quick Fix (Follow These Exact Steps)**

### **Step 1: Configure Supabase Redirect URLs (2 minutes)**

1. **Open:** https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/settings/auth

2. **Scroll down to:** "URL Configuration" section

3. **Find:** "Redirect URLs" field

4. **Add these URLs** (one per line):
   ```
   https://circletel-staging.vercel.app/auth/callback
   https://circletel-staging.vercel.app/auth/reset-password
   https://circletel-staging.vercel.app/**
   ```

5. **Click:** "Save" button at bottom

---

### **Step 2: Check Email Template (1 minute)**

1. **Open:** https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/auth/templates

2. **Click:** "Reset password" template

3. **Find this line:** (search for `ConfirmationURL`)
   ```html
   <a href="{{ .ConfirmationURL }}">
   ```

4. **Make sure it's NOT:**
   ```html
   <a href="{{ .ConfirmationURL }}.">  <!-- ❌ Extra period -->
   ```

5. **If you see the period, remove it and save**

---

### **Step 3: Test with Fresh Link (2 minutes)**

**Old link won't work - you MUST get a new one:**

1. **Go to:** https://circletel-staging.vercel.app/auth/forgot-password

2. **Enter:** jeffrey.de.wee@circletel.co.za

3. **Click:** "Send Reset Link"

4. **Check inbox** (should arrive within 1 minute)

5. **Click the NEW link** immediately (don't wait!)

6. **Should redirect to:** Password reset form (not 404!)

---

## ✅ **Expected Result**

After clicking the NEW reset link:

```
✅ URL: https://circletel-staging.vercel.app/auth/reset-password?token_hash=...
✅ Page: Password reset form with new password fields
✅ Action: Enter new password and submit
✅ Result: Password updated, redirect to login/dashboard
```

---

## 🚨 **Common Mistakes**

### ❌ **Using the OLD link**
- Old links expire after 1 hour
- Already-used links won't work again
- **Solution:** Request NEW password reset

### ❌ **Not saving Supabase changes**
- Redirect URLs must be saved
- Scroll to bottom and click "Save"
- **Solution:** Verify URLs are saved in dashboard

### ❌ **Waiting too long**
- Links expire in 1 hour
- Test immediately after receiving
- **Solution:** Click link right away

---

## 📋 **Quick Checklist**

Before testing again:

- [ ] Added redirect URLs to Supabase (3 URLs listed above)
- [ ] Saved changes in Supabase dashboard
- [ ] Checked email template for extra period
- [ ] Requested NEW password reset (not reusing old link)
- [ ] Clicked link within 5 minutes of receiving

---

## 🎬 **Test Now**

Ready to test? Run these commands:

```bash
# 1. Request new password reset via website
# Go to: https://circletel-staging.vercel.app/auth/forgot-password

# 2. Or test via API:
curl -X POST "https://agyjovdugmtopasyvlng.supabase.co/auth/v1/recover" \
  -H "apikey: sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7" \
  -H "Content-Type: application/json" \
  -d '{"email": "jeffrey.de.wee@circletel.co.za"}'

# 3. Check inbox and click link immediately
```

---

## 📞 **Still Not Working?**

If you still see errors after following these steps:

1. **Check which URL you're seeing:**
   - If still has period (`.#`): Email template needs fix
   - If no period but error: Redirect URLs not saved
   - If 404: Check Supabase redirect URLs

2. **Verify in browser:**
   - Open DevTools (F12)
   - Look at Network tab
   - See where redirect goes

3. **Share error with me:**
   - What URL do you see?
   - What error message?
   - Screenshot of the page?

---

**Time Required:** 5 minutes
**Success Rate:** Should work immediately after fix
**Key:** Use NEW reset link after configuration changes
