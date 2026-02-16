# CircleTel Email Template Setup Guide

## 📧 Customizing Supabase Auth Emails

This guide explains how to customize Supabase authentication emails with CircleTel branding.

## Option 1: Supabase Dashboard (Quick Setup)

### Step 1: Access Email Templates

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/agyjovdugmtopasyvlng)
2. Navigate to: **Authentication** → **Email Templates**

### Step 2: Customize Templates

Available templates:
- ✉️ **Confirm signup** - Email verification
- 🔑 **Reset password** - Password reset
- 📧 **Magic Link** - Passwordless login
- ✅ **Change Email Address** - Email change confirmation

### Step 3: Update Email Settings

**Sender Configuration:**
- Go to: **Authentication** → **Settings** → **SMTP Settings**
- Update sender details:
  ```
  Sender email: noreply@circletel.co.za
  Sender name: CircleTel
  ```

---

## Option 2: Custom SMTP (Recommended)

### Why Use Custom SMTP?

✅ Emails from `@circletel.co.za` domain
✅ Better deliverability
✅ Professional appearance
✅ More control over branding

### Setup with Resend (Recommended Provider)

1. **Sign up for Resend**: https://resend.com
2. **Verify your domain**: `circletel.co.za`
3. **Get API Key**: From Resend dashboard
4. **Configure in Supabase**:

   ```
   SMTP Host: smtp.resend.com
   Port: 587
   Username: resend
   Password: [Your Resend API Key]
   Sender Email: noreply@circletel.co.za
   Sender Name: CircleTel
   ```

---

## Email Template Variables

Supabase provides these variables for use in templates:

### Confirmation/Verification Email:
- `{{ .Email }}` - User's email address
- `{{ .ConfirmationURL }}` - Email verification link
- `{{ .SiteURL }}` - Your site URL
- `{{ .Token }}` - Verification token
- `{{ .TokenHash }}` - Token hash

### Password Reset Email:
- `{{ .Email }}` - User's email address
- `{{ .ConfirmationURL }}` - Password reset link
- `{{ .SiteURL }}` - Your site URL
- `{{ .Token }}` - Reset token
- `{{ .TokenHash }}` - Token hash

### Magic Link Email:
- `{{ .Email }}` - User's email address
- `{{ .ConfirmationURL }}` - Magic link
- `{{ .SiteURL }}` - Your site URL
- `{{ .Token }}` - Authentication token
- `{{ .TokenHash }}` - Token hash

---

## Ready-to-Use CircleTel Templates

### 1. Email Verification Template

**Location**: `lib/email/verification-templates.ts`

**How to Use**:
1. Copy the HTML from `getVerificationEmailHTML()` function
2. Go to Supabase Dashboard → Email Templates → **Confirm signup**
3. Paste the HTML (replace `${confirmationUrl}` with `{{ .ConfirmationURL }}`)
4. Save template

**Preview**:
- Orange gradient header with CircleTel logo
- Clear call-to-action button
- Professional footer with contact info
- Mobile-responsive design

### 2. Password Reset Template

**Location**: `lib/email/verification-templates.ts`

**How to Use**:
1. Copy the HTML from `getPasswordResetEmailHTML()` function
2. Go to Supabase Dashboard → Email Templates → **Reset password**
3. Paste the HTML (replace `${confirmationUrl}` with `{{ .ConfirmationURL }}`)
4. Save template

**Preview**:
- Same CircleTel branding
- Security warning for unauthorized requests
- 1-hour expiration notice

---

## Quick Template Setup (Copy-Paste)

### Minimal CircleTel Email Template

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
  📧 contactus@circletel.co.za<br>
  📞 082 487 3900
</p>

<p style="color: #999; font-size: 12px;">
  © {{ .Year }} CircleTel. All rights reserved.
</p>
```

---

## Testing Email Templates

### Test Email Verification:

1. Create a new account on CircleTel
2. Check your inbox for verification email
3. Verify:
   - ✅ Sender shows "CircleTel" or "CircleTel <noreply@circletel.co.za>"
   - ✅ Subject line is clear
   - ✅ CircleTel branding is visible
   - ✅ Verification button works
   - ✅ Email looks good on mobile

### Test Password Reset:

1. Go to password reset page
2. Enter your email
3. Check inbox for reset email
4. Verify:
   - ✅ Sender is CircleTel
   - ✅ Reset link works
   - ✅ Security warnings are present

---

## Troubleshooting

### Emails Not Sending

**Check:**
1. SMTP settings are correct
2. API keys are valid
3. Domain is verified (if using custom SMTP)
4. Rate limits not exceeded

### Emails Going to Spam

**Solutions:**
1. Use custom SMTP with verified domain
2. Add SPF/DKIM records to DNS
3. Warm up email sending gradually
4. Avoid spam trigger words

### Template Variables Not Working

**Common Issues:**
- Using `${variable}` instead of `{{ .Variable }}`
- Variable name case-sensitivity
- Missing template context

---

## Advanced: Programmatic Email Sending

For more control, you can intercept auth emails and send custom ones:

```typescript
// lib/email/custom-auth-emails.ts
import { getVerificationEmailHTML } from './verification-templates';

export async function sendCustomVerificationEmail(
  email: string,
  verificationUrl: string,
  firstName?: string
) {
  const htmlContent = getVerificationEmailHTML({
    email,
    confirmationUrl: verificationUrl,
    firstName,
  });

  // Send via your email service (Resend, SendGrid, etc.)
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'CircleTel <noreply@circletel.co.za>',
      to: email,
      subject: 'Verify Your CircleTel Account',
      html: htmlContent,
    }),
  });
}
```

---

## Checklist for Production

- [ ] Custom SMTP configured with CircleTel domain
- [ ] All email templates updated with branding
- [ ] Sender name set to "CircleTel"
- [ ] Sender email: noreply@circletel.co.za
- [ ] SPF and DKIM records configured
- [ ] Test emails sent and verified
- [ ] Mobile responsiveness checked
- [ ] Spam testing completed
- [ ] Contact information in footer
- [ ] Legal/unsubscribe links added (if required)

---

## Support

Need help with email setup?
- 📧 Email: contactus@circletel.co.za
- 💬 WhatsApp: 082 487 3900

---

**Last Updated**: 2025-10-28
**Version**: 1.0
**Maintained By**: CircleTel Development Team
