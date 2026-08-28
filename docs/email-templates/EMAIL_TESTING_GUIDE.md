# Email Notification Testing Guide

Complete guide to test Resend + Supabase email integration for CircleTel.

---

## 🚀 Quick Start (Automated Testing)

### **Option 1: Run Test Script (Recommended)**

```bash
node scripts/test-email-notifications.js
```

This interactive script will:
- ✅ Check environment variables
- ✅ Test Resend API connection
- ✅ Test account creation email
- ✅ Test password reset email
- ✅ Check Resend logs
- ✅ Provide detailed troubleshooting

**Time:** ~5-10 minutes

---

## 📋 Manual Testing (Step-by-Step)

### **Prerequisites**

Before testing, ensure:
- [ ] ✅ Resend API key added to `.env.local`
- [ ] ✅ Resend API key added to Vercel environment variables
- [ ] ✅ Supabase SMTP configured with Resend credentials
- [ ] ✅ Email templates uploaded to Supabase
- [ ] ✅ CircleTel domain verified in Resend

---

## 🧪 Test 1: Account Creation Email

### **Method A: Via Website**

1. **Go to:** https://circletel-staging.vercel.app/order/account
2. **Fill in form:**
   ```
   First Name: Test
   Last Name: User
   Email: your-email+test1@gmail.com
   Phone: 0871234567
   Password: TestPassword123!
   ```
3. **Click:** "Create Account"
4. **Expected:**
   - Toast: "Account created successfully!"
   - Toast: "📧 Verification email sent!"
   - Redirect to OTP verification page

5. **Check email inbox:**
   - **From:** CircleTel <noreply@notifications.circletelsa.co.za>
   - **Subject:** Verify Your CircleTel Account
   - **Content:** Orange CircleTel header, verification button
   - **Footer:** contactus@circletel.co.za / 084 773 9467

6. **Verify button works:**
   - Click "Verify Email Address"
   - Should redirect to CircleTel site
   - Account should be verified

### **Method B: Via Test Script**

```bash
node scripts/test-email-notifications.js
```

Select "yes" when asked to test account creation.

---

## 🔑 Test 2: Password Reset Email

### **Method A: Via Website**

1. **Go to:** https://circletel-staging.vercel.app/auth/forgot-password
2. **Enter email:** your-email@gmail.com (must be registered)
3. **Click:** "Send Reset Link"
4. **Expected:**
   - Success message appears
   - Email sent notification

5. **Check email inbox:**
   - **From:** CircleTel <noreply@notifications.circletelsa.co.za>
   - **Subject:** Reset Your CircleTel Password
   - **Content:** Orange CircleTel header, reset button, security warning
   - **Footer:** contactus@circletel.co.za / 084 773 9467

6. **Verify reset button works:**
   - Click "Reset My Password"
   - Should redirect to password reset form
   - Enter new password and confirm

### **Method B: Via Test Script**

```bash
node scripts/test-email-notifications.js
```

Select "yes" when asked to test password reset.

---

## 📊 Verification Checklist

### **For Each Email, Verify:**

#### **✅ Delivery**
- [ ] Email received within 1 minute
- [ ] Not in spam/junk folder
- [ ] From address shows: CircleTel <noreply@notifications.circletelsa.co.za>
- [ ] Subject line is correct

#### **✅ Branding**
- [ ] Orange gradient header with "CircleTel" logo
- [ ] CircleTel tagline: "High-Speed Connectivity for South Africa"
- [ ] Orange button/CTA
- [ ] Professional appearance

#### **✅ Content**
- [ ] Personalized greeting (if applicable)
- [ ] Clear call-to-action button
- [ ] Alternative text link provided
- [ ] Expiration notice visible (24 hours for verification, 1 hour for reset)
- [ ] Security warning (for password reset)

#### **✅ Footer**
- [ ] Contact email: contactus@circletel.co.za
- [ ] Contact WhatsApp: 084 773 9467
- [ ] Copyright: © 2025 CircleTel. All rights reserved.

#### **✅ Functionality**
- [ ] Main button link works
- [ ] Alternative text link works (copy-paste)
- [ ] Email addresses are clickable (mailto:)
- [ ] Phone number is clickable (tel:) on mobile

#### **✅ Mobile Responsiveness**
- [ ] Email looks good on mobile device
- [ ] Text is readable (not too small)
- [ ] Button is easily tappable
- [ ] Layout doesn't break on small screens

---

## 🔍 Where to Check Results

### **1. Email Inbox**
- Primary inbox
- Spam/Junk folder
- Promotions tab (Gmail)
- Other folders

### **2. Resend Dashboard**
**URL:** https://resend.com/emails

**Check:**
- Recent emails list
- Delivery status (sent, delivered, bounced)
- Open rates (if enabled)
- Error messages (if failed)

**Status Meanings:**
- ✅ **Delivered:** Email successfully sent
- ⏳ **Sent:** Email in transit
- ❌ **Bounced:** Email failed (invalid address)
- ⚠️ **Complained:** Marked as spam

### **3. Supabase Dashboard**
**URL:** https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/auth/users

**Check:**
- User created in "Users" tab
- Email confirmation status
- Last sign-in timestamp

### **4. Browser Console**
**When testing via website:**
- Open DevTools (F12)
- Check "Console" tab for errors
- Check "Network" tab for API calls

---

## 🛠️ Troubleshooting

### **Issue: Email Not Received**

#### **Possible Causes:**

1. **Supabase SMTP Not Configured**
   - **Fix:** Configure SMTP in Supabase → Settings → Auth → SMTP Settings
   - **Settings:**
     ```
     Host: smtp.resend.com
     Port: 587
     User: resend
     Password: [Your Resend API Key]
     Sender: noreply@notifications.circletelsa.co.za
     Name: CircleTel
     ```

2. **Resend Domain Not Verified**
   - **Check:** https://resend.com/domains
   - **Fix:** Add DNS records provided by Resend
   - **Wait:** DNS propagation (15 minutes - 48 hours)

3. **Wrong API Key**
   - **Check:** API key in Vercel matches Resend dashboard
   - **Fix:** Update environment variable and redeploy

4. **Rate Limiting**
   - **Resend limits:** 100 emails/day (free tier)
   - **Fix:** Upgrade Resend plan or wait 24 hours

5. **Email Blacklisted**
   - **Check:** Resend logs for bounce messages
   - **Fix:** Use different test email address

#### **Debugging Steps:**

```bash
# 1. Check environment variables
node scripts/verify-resend-integration.js

# 2. Test Resend API directly
curl -X GET https://api.resend.com/domains \
  -H "Authorization: Bearer YOUR_API_KEY"

# 3. Check Supabase user creation
# Go to Supabase Dashboard → Auth → Users
# Verify user was created

# 4. Check Resend logs
# https://resend.com/emails
# Look for recent sends and errors

# 5. Test with curl
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "CircleTel <noreply@notifications.circletelsa.co.za>",
    "to": "your-email@example.com",
    "subject": "Test Email",
    "html": "<h1>Test</h1>"
  }'
```

---

### **Issue: Email Received but Wrong Branding**

#### **Possible Causes:**

1. **Email Templates Not Uploaded**
   - **Fix:** Upload templates to Supabase → Auth → Email Templates
   - **Files:** `docs/email-templates/supabase-ready/`

2. **Wrong Template Used**
   - **Check:** Supabase "Confirm signup" and "Reset password" templates
   - **Fix:** Ensure correct template is active

3. **Template Variables Not Replaced**
   - **Check:** Look for `${...}` instead of `{{ .Variable }}`
   - **Fix:** Use converted templates from `supabase-ready/` folder

#### **Debugging Steps:**

```bash
# 1. Verify templates were converted
ls docs/email-templates/supabase-ready/
# Should see: verification-email-simple.html, password-reset-email-simple.html

# 2. Check template content
cat docs/email-templates/supabase-ready/verification-email-simple.html | grep "{{ .ConfirmationURL }}"
# Should find Supabase variables, not TypeScript ${variables}

# 3. Re-upload templates
# Copy content from supabase-ready/ folder
# Paste into Supabase dashboard
```

---

### **Issue: Email in Spam Folder**

#### **Possible Causes:**

1. **Domain Not Verified**
   - **Fix:** Verify domain in Resend with DNS records

2. **Missing SPF/DKIM Records**
   - **Fix:** Add DNS records:
     ```
     Type: TXT
     Name: notifications.circletelsa.co.za
     Value: v=spf1 include:_spf.resend.com ~all

     Type: TXT
     Name: resend._domainkey.notifications.circletelsa.co.za
     Value: [Provided by Resend]
     ```

3. **New Domain (No Reputation)**
   - **Fix:** Warm up domain gradually (start with few emails per day)

4. **Content Triggers Spam Filters**
   - **Check:** Avoid words like "URGENT", "FREE", "CLICK NOW"
   - **Fix:** Use simplified templates

---

### **Issue: Button/Link Not Working**

#### **Possible Causes:**

1. **Wrong Variable Syntax**
   - **Check:** Should be `{{ .ConfirmationURL }}` not `${confirmationUrl}`
   - **Fix:** Use converted templates

2. **Supabase Redirect URL Not Set**
   - **Check:** Supabase → Settings → Auth → Redirect URLs
   - **Fix:** Add: `https://circletel-staging.vercel.app/**`

3. **Link Expired**
   - **Verification:** 24 hours expiry
   - **Reset:** 1 hour expiry
   - **Fix:** Request new email

---

## 📈 Success Metrics

### **What Good Looks Like:**

| Metric | Target | Check |
|--------|--------|-------|
| Delivery Time | < 1 minute | ✅ Fast delivery |
| Delivery Rate | > 95% | ✅ Most emails arrive |
| Open Rate | > 40% | ✅ Users open emails |
| Click Rate | > 20% | ✅ Users click buttons |
| Spam Rate | < 0.1% | ✅ Not marked as spam |
| Bounce Rate | < 2% | ✅ Valid email addresses |

**Check these in:** Resend Dashboard → Analytics

---

## 🎯 Testing Scenarios

### **Scenario 1: New User Registration**
1. User creates account on CircleTel
2. Verification email sent instantly
3. User receives email within 1 minute
4. User clicks verification button
5. Account verified, user can log in

### **Scenario 2: Forgot Password**
1. User clicks "Forgot Password"
2. Enters email address
3. Reset email sent instantly
4. User receives email within 1 minute
5. User clicks reset button
6. User sets new password
7. User can log in with new password

### **Scenario 3: Email Change**
1. User changes email in dashboard
2. Verification email sent to NEW email
3. User verifies new email
4. Email updated in account

---

## 🔄 Continuous Testing

### **Development:**
```bash
# Test locally before committing
npm run dev
# Create test account at localhost:3000
```

### **Staging:**
```bash
# Test on Vercel staging after deployment
# URL: https://circletel-staging.vercel.app
# Create test account and verify emails
```

### **Production:**
```bash
# Final test on production before announcing
# URL: https://circletel.co.za
# Use real email address for testing
```

---

## 📞 Support

### **If Tests Fail After Following Guide:**

1. **Check Status Pages:**
   - Resend: https://status.resend.com
   - Supabase: https://status.supabase.com

2. **Contact Support:**
   - Resend: https://resend.com/support
   - Supabase: https://supabase.com/support

3. **CircleTel Team:**
   - Email: contactus@circletel.co.za
   - WhatsApp: 084 773 9467

---

## 📝 Test Log Template

Use this template to document your tests:

```
Date: 2025-10-28
Tester: [Your Name]
Environment: [Staging/Production]

Test 1: Account Creation Email
- Email sent: [Yes/No]
- Delivery time: [< 1 min / X minutes]
- Branding correct: [Yes/No]
- Button works: [Yes/No]
- Mobile responsive: [Yes/No]
- Result: [PASS/FAIL]
- Notes: [Any issues]

Test 2: Password Reset Email
- Email sent: [Yes/No]
- Delivery time: [< 1 min / X minutes]
- Branding correct: [Yes/No]
- Button works: [Yes/No]
- Security warning visible: [Yes/No]
- Result: [PASS/FAIL]
- Notes: [Any issues]

Overall Result: [PASS/FAIL]
Issues Found: [List any issues]
Action Items: [Next steps]
```

---

**Last Updated:** 2025-10-28
**Test Script:** `scripts/test-email-notifications.js`
**Templates:** `docs/email-templates/supabase-ready/`
