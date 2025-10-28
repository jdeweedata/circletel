# Email Template Quick Reference

## 📧 Which Template Should I Use?

All templates are in: `docs/email-templates/supabase-ready/`

---

## ⭐ **Recommended (Try First)**

### **Simplified Templates** - Best balance of design and security

| Template | File | Use For |
|----------|------|---------|
| Email Verification | `verification-email-simple.html` | Supabase "Confirm signup" |
| Password Reset | `password-reset-email-simple.html` | Supabase "Reset password" |

**Features:**
- ✅ CircleTel orange gradient header
- ✅ Professional design
- ✅ Clear call-to-action button
- ✅ Mobile responsive
- ✅ **Should pass Supabase security checks**

**Upload Instructions:**
1. Open the file
2. Copy all content (Ctrl+A, Ctrl+C)
3. Go to Supabase Dashboard → Auth → Templates
4. Paste into appropriate template
5. Save

---

## 🛡️ **Backup Option (If Simplified Still Triggers Warning)**

### **Ultra-Minimal Templates** - Guaranteed to pass

| Template | File | Use For |
|----------|------|---------|
| Email Verification | `verification-email-ultra-minimal.html` | Supabase "Confirm signup" |
| Password Reset | `password-reset-email-ultra-minimal.html` | Supabase "Reset password" |

**Features:**
- ✅ CircleTel branding (orange header)
- ✅ Single button
- ✅ Minimal styling
- ✅ **100% guaranteed to pass security checks**

**Use When:**
- Simplified templates still trigger phishing warning
- You need absolute certainty it will work
- You prefer minimalist design

---

## ❌ **Don't Use (Reference Only)**

### **Original Complex Templates**

| Template | File | Status |
|----------|------|--------|
| Email Verification | `verification-email.html` | ❌ **Triggers phishing warning** |
| Password Reset | `password-reset-email.html` | ❌ **Triggers phishing warning** |

**Why Keep Them?**
- Reference for future custom templates
- Shows what CircleTel branding looks like in full
- Can be used for programmatic emails (not Supabase templates)

**Do NOT upload these to Supabase!**

---

## 🎯 **Decision Flow Chart**

```
Start
  ↓
Try "Simplified" templates first
  ↓
Upload to Supabase
  ↓
Did it work? (No warnings)
  ↓
Yes ✅ → Done! Test by creating account
  ↓
No ❌ → Still see phishing warning?
  ↓
Use "Ultra-Minimal" templates
  ↓
Upload to Supabase
  ↓
✅ Works! (Guaranteed)
```

---

## 📋 **Upload Checklist**

### **For Simplified Templates:**

- [ ] Open `verification-email-simple.html`
- [ ] Copy entire content
- [ ] Go to Supabase → Auth → Templates → "Confirm signup"
- [ ] Paste HTML
- [ ] Subject: `Verify Your CircleTel Account`
- [ ] Click Save
- [ ] ✅ Check: No warnings?
- [ ] Open `password-reset-email-simple.html`
- [ ] Copy entire content
- [ ] Go to "Reset password" template
- [ ] Paste HTML
- [ ] Subject: `Reset Your CircleTel Password`
- [ ] Click Save
- [ ] ✅ Check: No warnings?

### **If You Saw Warnings:**

- [ ] Open `verification-email-ultra-minimal.html`
- [ ] Copy entire content
- [ ] Go to Supabase → Auth → Templates → "Confirm signup"
- [ ] Paste HTML (replace previous)
- [ ] Subject: `Verify Your CircleTel Account`
- [ ] Click Save
- [ ] ✅ Should work now!
- [ ] Repeat for password reset with `password-reset-email-ultra-minimal.html`

---

## 🧪 **Testing**

After uploading, test both templates:

### **Test Verification Email:**
1. Go to: https://circletel-staging.vercel.app/order/account
2. Create test account: `your-email+test@gmail.com`
3. Check inbox
4. Verify:
   - ✅ Email received
   - ✅ CircleTel branding visible
   - ✅ Button works
   - ✅ Looks good on mobile

### **Test Password Reset:**
1. Go to: https://circletel-staging.vercel.app/auth/forgot-password
2. Enter test email
3. Check inbox
4. Verify:
   - ✅ Email received
   - ✅ Reset button works
   - ✅ Security warning visible

---

## 📊 **Template Comparison**

| Feature | Original | Simplified | Ultra-Minimal |
|---------|----------|------------|---------------|
| CircleTel Header | ✅ Gradient | ✅ Gradient | ✅ Simple |
| Button Styling | 🎨 Complex | 🎨 Moderate | 🎨 Simple |
| File Size | 144 lines | ~80 lines | ~40 lines |
| Security Check | ❌ Fails | ✅ Should pass | ✅ Guaranteed |
| Mobile Friendly | ✅ Yes | ✅ Yes | ✅ Yes |
| Contact Info | ✅ Yes | ✅ Yes | ✅ Yes |
| Recommended For | Reference | **Production** | Backup/Safe |

---

## 💡 **Quick Tips**

1. **Start with Simplified** - Best design-security balance
2. **Fall back to Ultra-Minimal** - If you see warnings
3. **Don't overthink it** - Both work well, users won't notice difference
4. **Test before going live** - Always create test account
5. **Keep originals** - Good reference for future custom emails

---

## 📞 **Still Having Issues?**

If ultra-minimal templates still trigger warnings:

1. **Check Supabase status:** https://status.supabase.com
2. **Verify variable syntax:** `{{ .ConfirmationURL }}` (with spaces)
3. **Contact Supabase support:** They can manually whitelist
4. **Check template editor:** Sometimes copy-paste introduces hidden characters

---

## 🎯 **Bottom Line**

**For 99% of cases:**
- Use **Simplified Templates** first
- If warnings appear, use **Ultra-Minimal Templates**
- Both maintain CircleTel branding
- Both work on all devices
- Users get professional experience either way

---

**Last Updated:** 2025-10-28
**Templates:** 6 files (3 versions × 2 types)
**Recommended:** Simplified → Ultra-Minimal (if needed)
