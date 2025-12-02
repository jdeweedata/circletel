# Supabase Email Templates for CircleTel

This folder contains email templates designed to match the CircleTel brand for use in Supabase Authentication.

## How to Apply These Templates

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Select the template you want to update (e.g., "Reset Password")
3. Copy the HTML content from the corresponding `.html` file
4. Paste it into the "Body" field
5. Update the "Subject" field as specified below
6. Click **Save**

---

## Password Reset Email

**File:** `supabase-password-reset.html`

**Subject Line:**
```
Reset Your Password - CircleTel
```

**Variables Used:**
- `{{ .ConfirmationURL }}` - The password reset link (required)

---

## Design Features

The templates follow CircleTel's brand guidelines:

- **Primary Color (Orange):** `#F5831F`
- **Secondary Color (Blue):** `#1E4B85`
- **Font:** Arial, Helvetica, sans-serif
- **Logo:** CircleTel enclosed logo
- **Footer:** Includes ICASA license, POPIA compliance, and contact info

---

## Template Checklist

- [x] Password Reset (`supabase-password-reset.html`)
- [ ] Email Confirmation (signup)
- [ ] Magic Link
- [ ] Email Change Confirmation
- [ ] Invite User

---

## Testing

After applying a template:

1. Request a password reset from the forgot password page
2. Check your email for the new branded template
3. Verify the reset link works correctly

---

## Notes

- Supabase uses Go template syntax: `{{ .VariableName }}`
- Available variables:
  - `{{ .ConfirmationURL }}` - Full URL for the action
  - `{{ .Token }}` - Just the token (for OTP)
  - `{{ .TokenHash }}` - Hashed token
  - `{{ .SiteURL }}` - Your site URL
  - `{{ .Email }}` - User's email address
  - `{{ .RedirectTo }}` - Redirect URL after action
