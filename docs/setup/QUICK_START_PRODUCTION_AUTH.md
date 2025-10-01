# Quick Start: Production Auth Setup (5 Minutes)

This is the fastest way to get production authentication working. For detailed explanations, see [SUPABASE_AUTH_USER_CREATION.md](./SUPABASE_AUTH_USER_CREATION.md).

## 🚀 5-Minute Setup

### Step 1: Open Supabase Dashboard
Go to: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/auth/users

### Step 2: Create 4 Admin Users

Click **"Add user"** → **"Create new user"** for each:

#### User 1: Super Admin
```
UUID:     a0000000-0000-0000-0000-000000000001
Email:    admin@circletel.co.za
Password: admin123
Auto Confirm: ✅ YES
```

#### User 2: Product Manager
```
UUID:     a0000000-0000-0000-0000-000000000002
Email:    product.manager@circletel.co.za
Password: pm123
Auto Confirm: ✅ YES
```

#### User 3: Editor
```
UUID:     a0000000-0000-0000-0000-000000000003
Email:    editor@circletel.co.za
Password: editor123
Auto Confirm: ✅ YES
```

#### User 4: Viewer
```
UUID:     a0000000-0000-0000-0000-000000000004
Email:    viewer@circletel.co.za
Password: viewer123
Auto Confirm: ✅ YES
```

### Step 3: Verify
- All 4 users should appear in the list
- All should have "Confirmed" status ✅
- UUIDs should match exactly

### Step 4: Test Login
Go to: https://circletel-staging.vercel.app/admin/login

Try: `admin@circletel.co.za` / `admin123`

## ✅ Done!

If login works, you're all set. If not, see troubleshooting below.

---

## 🔧 Common Issues

### Issue: Login still shows "Authentication request failed"

**Check 1:** Is dev mode enabled on staging?
- Should see test credentials displayed on login page
- If yes, login should work without Supabase users

**Check 2:** Are you on production domain?
- Staging (*.vercel.app) uses dev mode
- Production (circletel.co.za) requires real Supabase users

**Fix:** Follow Step 2 above to create users.

### Issue: "User is not an admin"

**Cause:** User exists in Supabase Auth but not in admin_users table.

**Fix:** Run migrations:
```bash
cd circletel-nextjs
supabase db push
```

Or manually verify in SQL Editor:
```sql
SELECT * FROM admin_users WHERE email = 'admin@circletel.co.za';
```

### Issue: UUID doesn't match

**Cause:** Supabase generated a different UUID.

**Fix:** Delete user and recreate with exact UUID from Step 2.

---

## 📋 Checklist

Use this checklist to ensure everything is set up:

- [ ] Can access Supabase Dashboard
- [ ] Navigated to Authentication → Users
- [ ] Created user: admin@circletel.co.za (UUID: a0000000...0001)
- [ ] Created user: product.manager@circletel.co.za (UUID: a0000000...0002)
- [ ] Created user: editor@circletel.co.za (UUID: a0000000...0003)
- [ ] Created user: viewer@circletel.co.za (UUID: a0000000...0004)
- [ ] All users have "Confirmed" status ✅
- [ ] Tested login on staging works
- [ ] (Optional) Changed default passwords

---

## 🔐 Security Notes

**⚠️ These are TEST credentials**

For production use:
1. Change all passwords immediately
2. Use strong passwords (12+ chars, mixed case, numbers, symbols)
3. Enable MFA if available
4. Rotate service role keys
5. Set up proper access request approval workflow

---

## 📚 Full Documentation

For detailed explanations, troubleshooting, and alternative methods:
- [Full Setup Guide](./SUPABASE_AUTH_USER_CREATION.md)
- [Admin Auth Overview](../admin-auth-setup.md)

## 🆘 Need Help?

1. Check browser console for errors
2. Check Supabase logs: Dashboard → Logs
3. Verify migrations ran: Dashboard → Database → Migrations
4. Review full documentation above
