# Resend Email Integration - Implementation Checklist

## Current Status
- ✅ Resend account created
- ✅ API key generated (`circletel-nextjs app` - Full access)
- ✅ Email templates created (`lib/email/verification-templates.ts`)
- ✅ Setup guide written (`SUPABASE_EMAIL_SETUP.md`)
- ⏳ **Next Steps Below**

---

## Step 1: Add Resend API Key to Vercel

### Option A: Via Vercel Dashboard (Recommended)
You were viewing this page in your screenshot. Here's exactly what to do:

1. Go to: https://vercel.com/circletel/circletel-staging/settings/environment-variables
2. Click **"Add New"** button (top right)
3. Fill in:
   ```
   Key: RESEND_API_KEY
   Value: [Paste your Resend API key from the dialog]
   ```
4. **Select Environments:**
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Click **Save**
6. **Redeploy** - Trigger a new deployment for the variable to take effect

### Option B: Via Vercel CLI
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login
vercel login

# Add environment variable
vercel env add RESEND_API_KEY production
# Paste your API key when prompted

# Add for preview and development too
vercel env add RESEND_API_KEY preview
vercel env add RESEND_API_KEY development
```

### Add to Local `.env.local` (for local testing)
```bash
# Open .env.local and add:
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Step 2: Verify Domain in Resend

### Check Domain Status
1. Go to: https://resend.com/domains
2. Look for: `notifications.circletelsa.co.za`
3. **If NOT verified**, you need to add DNS records:

### DNS Records to Add (via your domain provider)
```
Type: TXT
Name: _resend
Value: [Provided by Resend dashboard]
TTL: 300

Type: MX
Name: notifications.circletelsa.co.za
Value: feedback-smtp.eu-west-1.amazonses.com
Priority: 10
TTL: 300
```

**Note:** DNS propagation can take up to 48 hours, but usually completes in 15-30 minutes.

---

## Step 3: Configure Supabase SMTP Settings

1. **Go to Supabase Dashboard:**
   https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/settings/auth

2. **Navigate to:**
   Authentication → Settings → SMTP Settings

3. **Enable Custom SMTP:**
   Toggle "Enable Custom SMTP" → ON

4. **Enter Configuration:**
   ```
   SMTP Host: smtp.resend.com
   SMTP Port: 587
   SMTP User: resend
   SMTP Password: [Your Resend API Key - same one from Step 1]

   Sender Email: noreply@notifications.circletelsa.co.za
   Sender Name: CircleTel
   ```

5. **Click "Save"**

6. **Test Connection:**
   - Supabase should show a green checkmark if SMTP is working
   - If error, double-check API key and domain verification

---

## Step 4: Update Supabase Email Templates

### Template 1: Email Verification (Confirm signup)

1. **Go to:**
   https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/auth/templates

2. **Click on "Confirm signup" template**

3. **Replace entire HTML with:**
   - Open: `lib/email/verification-templates.ts`
   - Copy the HTML from `getVerificationEmailHTML()` function (lines 19-144)
   - **Find and replace:**
     - `${confirmationUrl}` → `{{ .ConfirmationURL }}`
     - `${email}` → `{{ .Email }}`
     - `${firstName}` → Leave as is (Supabase doesn't have this by default)
     - `${greeting}` → `{{ if .Email }}Hi there{{ else }}Hi{{ end }}`
     - `${currentYear}` → `{{ .Year }}`

4. **Update Subject Line:**
   ```
   Verify Your CircleTel Account - Welcome! 🎉
   ```

5. **Click "Save"**

### Template 2: Password Reset

1. **Click on "Reset password" template**

2. **Replace entire HTML with:**
   - Copy from `getPasswordResetEmailHTML()` (lines 147-256)
   - **Apply same find/replace** as above

3. **Update Subject Line:**
   ```
   Reset Your CircleTel Password
   ```

4. **Click "Save"**

### Quick Minimal Template (Alternative)
If you prefer a simpler template, use this ready-to-paste version:

```html
<h2 style="color: #F5831F;">CircleTel</h2>

<p>{{ if .Email }}Hi {{ .Email }},{{ else }}Hi there,{{ end }}</p>

<p>Please verify your email address to complete your CircleTel account setup.</p>

<a href="{{ .ConfirmationURL }}"
   style="display: inline-block; background-color: #F5831F; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold;">
  Verify Email Address
</a>

<p style="color: #666; font-size: 14px;">
  Or copy and paste this link:<br>
  {{ .ConfirmationURL }}
</p>

<p style="color: #666; font-size: 12px;">
  This link expires in 24 hours. If you didn't create a CircleTel account, please ignore this email.
</p>

<hr style="border: 1px solid #eee; margin: 20px 0;">

<p style="color: #666; font-size: 14px;">
  Need help? Contact us:<br>
  📧 support@circletel.co.za<br>
  📞 087 777 2473
</p>

<p style="color: #999; font-size: 12px;">
  © 2025 CircleTel. All rights reserved.
</p>
```

---

## Step 5: Test Email Flow

### Test 1: Email Verification
```bash
# Create a test account on staging
# URL: https://circletel-staging.vercel.app/order/account

# Test email: your-email+test1@gmail.com
# (Gmail ignores +test1, so it goes to your-email@gmail.com)
```

**Expected Result:**
1. Email received within 1 minute
2. Sender shows: `CircleTel <noreply@notifications.circletelsa.co.za>`
3. Subject: "Verify Your CircleTel Account - Welcome! 🎉"
4. Orange CircleTel branding visible
5. Verification button works
6. Email looks good on mobile (check phone)

### Test 2: Password Reset
```bash
# Go to password reset page
# URL: https://circletel-staging.vercel.app/auth/forgot-password

# Enter test email
```

**Expected Result:**
1. Email received within 1 minute
2. CircleTel branding
3. Security warning visible
4. Reset link works
5. Link expires in 1 hour (check timestamp)

### Test 3: Deliverability Check
- **Check spam folder** - Should NOT be in spam
- **Check email headers** - Should show Resend sending
- **Test multiple providers:**
  - ✅ Gmail
  - ✅ Outlook
  - ✅ Yahoo Mail (if possible)

---

## Step 6: Verify Integration with Script

Run this validation script to check all configuration:

```bash
# From project root
node scripts/verify-resend-integration.js
```

This will check:
- ✅ RESEND_API_KEY environment variable exists
- ✅ Resend API is reachable
- ✅ Domain verification status
- ✅ Email templates exist in codebase
- ✅ Supabase SMTP configuration (manual check)

---

## Troubleshooting

### Issue: Emails Not Sending
**Symptoms:** Users not receiving verification emails

**Check:**
1. Resend Dashboard → Logs → Look for failed sends
2. Supabase Dashboard → Auth Logs → Check for errors
3. Verify API key is correct in both Vercel and Supabase
4. Check domain verification status

**Common Fixes:**
- Re-save SMTP settings in Supabase
- Redeploy Vercel app after adding env var
- Wait for DNS propagation (up to 48 hours)

### Issue: Emails in Spam
**Symptoms:** Emails delivered but marked as spam

**Solutions:**
1. **Add SPF Record** (DNS):
   ```
   Type: TXT
   Name: notifications.circletelsa.co.za
   Value: v=spf1 include:_spf.resend.com ~all
   ```

2. **Add DKIM Record** (provided by Resend):
   ```
   Type: TXT
   Name: resend._domainkey.notifications.circletelsa.co.za
   Value: [Provided by Resend]
   ```

3. **Add DMARC Record** (DNS):
   ```
   Type: TXT
   Name: _dmarc.notifications.circletelsa.co.za
   Value: v=DMARC1; p=none; rua=mailto:support@circletel.co.za
   ```

4. **Warm Up Domain:**
   - Send gradually increasing volumes over 2-4 weeks
   - Start with 50 emails/day, increase by 50% every few days

### Issue: Wrong Sender Name/Email
**Check:**
- Supabase SMTP settings → Sender Email and Sender Name
- Resend Dashboard → Verified Domains

### Issue: Template Variables Not Working
**Common mistakes:**
- Using `${variable}` instead of `{{ .Variable }}`
- Wrong variable names (case-sensitive)
- Missing template context in Supabase

---

## Production Checklist

Before going live with custom emails:

- [ ] ✅ RESEND_API_KEY added to Vercel (Production)
- [ ] ✅ Domain verified in Resend (`notifications.circletelsa.co.za`)
- [ ] ✅ SPF, DKIM, DMARC records configured
- [ ] ✅ Supabase SMTP settings configured and tested
- [ ] ✅ Email templates uploaded to Supabase
- [ ] ✅ Verification email tested (received, branded, link works)
- [ ] ✅ Password reset email tested
- [ ] ✅ Mobile responsiveness verified
- [ ] ✅ Spam testing completed (Gmail, Outlook)
- [ ] ✅ No errors in Resend logs
- [ ] ✅ No errors in Supabase auth logs

---

## Next Steps After Completion

1. **Monitor Resend Dashboard:**
   - Check daily for bounces/complaints
   - Monitor delivery rates (should be >95%)

2. **Optimize Templates:**
   - A/B test subject lines
   - Add personalization (first name)
   - Track click rates

3. **Add More Email Types:**
   - Order confirmation email
   - Payment success email
   - Installation scheduled email
   - Welcome series (drip campaign)

---

## Quick Reference

| Action | URL |
|--------|-----|
| Resend Dashboard | https://resend.com/overview |
| Resend Domains | https://resend.com/domains |
| Resend Logs | https://resend.com/logs |
| Supabase Auth Settings | https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/settings/auth |
| Supabase Email Templates | https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/auth/templates |
| Vercel Env Vars | https://vercel.com/circletel/circletel-staging/settings/environment-variables |
| Email Template Code | `/lib/email/verification-templates.ts` |
| Setup Guide | `/docs/email-templates/SUPABASE_EMAIL_SETUP.md` |

---

**Last Updated:** 2025-10-28
**Status:** Ready for implementation
**Estimated Time:** 30-45 minutes (excluding DNS propagation)
