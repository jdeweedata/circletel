# Quick Email Testing Setup

## ⚡ Fast Track (5 Minutes)

### **Step 1: Add Resend API Key to Local Environment (30 seconds)**

1. **Get your Resend API key:**
   - Go to: https://resend.com/api-keys
   - Copy your API key (starts with `re_`)

2. **Add to `.env.local`:**

Open `.env.local` in your project root and add:

```env
# Resend Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Example:**
```env
# Existing variables...
NEXT_PUBLIC_SUPABASE_URL=https://agyjovdugmtopasyvlng.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Add this line:
RESEND_API_KEY=re_abc123xyz789
```

3. **Save the file** (Ctrl+S)

---

### **Step 2: Configure Supabase SMTP (2 minutes)**

1. **Go to:** https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/settings/auth

2. **Scroll to:** "SMTP Settings"

3. **Click:** "Enable Custom SMTP" (toggle ON)

4. **Enter these settings:**
   ```
   Host: smtp.resend.com
   Port: 587
   Sender name: CircleTel
   Sender email: noreply@notifications.circletelsa.co.za
   Username: resend
   Password: [Paste your Resend API key here - same as Step 1]
   ```

5. **Click:** "Save" at bottom of page

---

### **Step 3: Upload Email Templates (2 minutes)**

1. **Open file:** `docs/email-templates/supabase-ready/verification-email-simple.html`
2. **Copy all content** (Ctrl+A, Ctrl+C)
3. **Go to:** https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/auth/templates
4. **Click:** "Confirm signup" template
5. **Paste** content into editor
6. **Subject line:** `Verify Your CircleTel Account`
7. **Save**

8. **Open file:** `docs/email-templates/supabase-ready/password-reset-email-simple.html`
9. **Copy all content**
10. **Click:** "Reset password" template
11. **Paste** content into editor
12. **Subject line:** `Reset Your CircleTel Password`
13. **Save**

---

### **Step 4: Run Test (30 seconds)**

```bash
node scripts/test-email-notifications.js
```

**Follow prompts:**
- Enter test email when asked
- Check your inbox
- Confirm if email received

---

## 🎯 Quick Verification

After setup, you should see:

✅ All environment variables present
✅ Connected to Resend API
✅ CircleTel domain verified
✅ Email sent and received
✅ CircleTel branding visible

---

## 🚨 Common Issues

### **Issue: "RESEND_API_KEY not found"**
**Fix:** Add API key to `.env.local` (see Step 1)

### **Issue: "Domain not verified"**
**Fix:** Go to https://resend.com/domains and verify your domain

### **Issue: Email not received**
**Check:**
1. Spam/Junk folder
2. Supabase SMTP settings saved
3. Resend logs: https://resend.com/emails

---

## 📞 Need Help?

If stuck after following these steps:
1. Check Resend status: https://status.resend.com
2. Check Supabase status: https://status.supabase.com
3. Contact: contactus@circletel.co.za / 082 487 3900

---

**Estimated Time:** 5 minutes
**Difficulty:** Easy
**Result:** Working email notifications!
