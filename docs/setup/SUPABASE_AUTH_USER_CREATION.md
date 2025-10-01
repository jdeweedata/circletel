# Supabase Auth User Creation - Step by Step Guide

This guide walks you through creating admin users in Supabase Auth for production deployment.

## Prerequisites

Before starting, ensure you have:
- [ ] Access to Supabase Dashboard (https://supabase.com/dashboard)
- [ ] Project created (`agyjovdugmtopasyvlng`)
- [ ] Admin privileges on the Supabase project
- [ ] Database migrations applied (see [Admin Auth Setup](../admin-auth-setup.md))

## Overview

You need to create users in **two places**:
1. **Supabase Auth** - Handles authentication (login, sessions, passwords)
2. **admin_users table** - Already created by migration, stores roles and permissions

The migration has already created records in the `admin_users` table with specific UUIDs. Now you need to create matching Supabase Auth users with the same UUIDs.

---

## Method 1: Using Supabase Dashboard (Recommended for First-Time Setup)

### Step 1: Access Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Sign in with your Supabase account
3. Select your project: **agyjovdugmtopasyvlng**

### Step 2: Navigate to Authentication

1. In the left sidebar, click **"Authentication"**
2. Click **"Users"** sub-menu
3. You should see the Users management page

### Step 3: Create Super Admin User

1. Click the **"Add user"** button (top right)
2. Select **"Create new user"**
3. Fill in the form:

   **User ID (UUID):**
   ```
   a0000000-0000-0000-0000-000000000001
   ```

   **Email:**
   ```
   admin@circletel.co.za
   ```

   **Password:**
   ```
   admin123
   ```

   **Confirm Password:**
   ```
   admin123
   ```

   **Auto Confirm User:** ✅ Check this box (important!)

4. Click **"Create user"**

5. **Verify creation:**
   - User should appear in the users list
   - Status should be "Confirmed" (green checkmark)
   - UUID should match exactly: `a0000000-0000-0000-0000-000000000001`

### Step 4: Create Product Manager User

Repeat Step 3 with these credentials:

**User ID (UUID):**
```
a0000000-0000-0000-0000-000000000002
```

**Email:**
```
product.manager@circletel.co.za
```

**Password:**
```
pm123
```

**Auto Confirm User:** ✅ Check this box

### Step 5: Create Editor User

Repeat Step 3 with these credentials:

**User ID (UUID):**
```
a0000000-0000-0000-0000-000000000003
```

**Email:**
```
editor@circletel.co.za
```

**Password:**
```
editor123
```

**Auto Confirm User:** ✅ Check this box

### Step 6: Create Viewer User

Repeat Step 3 with these credentials:

**User ID (UUID):**
```
a0000000-0000-0000-0000-000000000004
```

**Email:**
```
viewer@circletel.co.za
```

**Password:**
```
viewer123
```

**Auto Confirm User:** ✅ Check this box

### Step 7: Verify All Users Created

1. In the Users list, you should now see **4 users**:
   - admin@circletel.co.za
   - product.manager@circletel.co.za
   - editor@circletel.co.za
   - viewer@circletel.co.za

2. All should have status "Confirmed" ✅

3. Click on each user to verify the UUID matches

---

## Method 2: Using Supabase CLI (For Developers)

### Step 1: Install Supabase CLI

```bash
# Using npm
npm install -g supabase

# Or using brew (macOS)
brew install supabase/tap/supabase
```

### Step 2: Login to Supabase

```bash
supabase login
```

This will open a browser window for authentication.

### Step 3: Link to Your Project

```bash
cd circletel-nextjs
supabase link --project-ref agyjovdugmtopasyvlng
```

### Step 4: Get Your Service Role Key

1. Go to Supabase Dashboard → Project Settings → API
2. Copy the **"service_role"** key (starts with `eyJ...`)
3. Store it temporarily (you'll need it for the script)

### Step 5: Create Users Script

Create a file `scripts/create-admin-users.js`:

```javascript
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://agyjovdugmtopasyvlng.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'your-service-role-key-here' // Replace with your key

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const users = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    email: 'admin@circletel.co.za',
    password: 'admin123',
    role: 'super_admin'
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    email: 'product.manager@circletel.co.za',
    password: 'pm123',
    role: 'product_manager'
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    email: 'editor@circletel.co.za',
    password: 'editor123',
    role: 'editor'
  },
  {
    id: 'a0000000-0000-0000-0000-000000000004',
    email: 'viewer@circletel.co.za',
    password: 'viewer123',
    role: 'viewer'
  }
]

async function createAdminUsers() {
  console.log('Creating admin users...\n')

  for (const user of users) {
    console.log(`Creating user: ${user.email}`)

    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          role: user.role
        }
      })

      if (error) {
        console.error(`❌ Error creating ${user.email}:`, error.message)
      } else {
        console.log(`✅ Created ${user.email} (ID: ${data.user.id})`)

        // Note: The user ID will be auto-generated, not our custom UUID
        // You'll need to update the admin_users table to match
        console.log(`⚠️  Update admin_users table: UPDATE admin_users SET id = '${data.user.id}' WHERE email = '${user.email}';`)
      }
      console.log('')
    } catch (err) {
      console.error(`❌ Exception creating ${user.email}:`, err)
    }
  }
}

createAdminUsers()
  .then(() => console.log('Done!'))
  .catch(err => console.error('Fatal error:', err))
```

### Step 6: Run the Script

```bash
# Install dependencies
npm install @supabase/supabase-js

# Run the script
node scripts/create-admin-users.js
```

**Note:** The Supabase Admin API creates users with auto-generated UUIDs. You'll need to manually update the `admin_users` table to match the generated IDs, or delete and recreate with custom UUIDs.

---

## Method 3: Using SQL + Manual Password Reset (Alternative)

If you want to use the exact UUIDs from the migration:

### Step 1: Create Auth Users via SQL

Run this in the Supabase SQL Editor:

```sql
-- Insert users into auth.users table (requires service role)
-- Note: This is a workaround and may not work with all Supabase versions

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role
)
VALUES
  (
    'a0000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'admin@circletel.co.za',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
  ),
  (
    'a0000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'product.manager@circletel.co.za',
    crypt('pm123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
  ),
  (
    'a0000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'editor@circletel.co.za',
    crypt('editor123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
  ),
  (
    'a0000000-0000-0000-0000-000000000004'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'viewer@circletel.co.za',
    crypt('viewer123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
  )
ON CONFLICT (id) DO NOTHING;
```

**⚠️ Warning:** Direct manipulation of auth.users table is not officially supported and may cause issues. Use Method 1 (Dashboard) instead.

---

## Verification

After creating users by any method, verify everything works:

### 1. Check Database

Run this SQL query:

```sql
-- Verify admin_users and auth.users match
SELECT
  au.id,
  au.email,
  au.role,
  au.is_active,
  CASE WHEN u.id IS NOT NULL THEN '✅ Exists' ELSE '❌ Missing' END as auth_user_status
FROM admin_users au
LEFT JOIN auth.users u ON u.id = au.id
ORDER BY au.email;
```

Expected output:
```
id                                   | email                           | role            | is_active | auth_user_status
-------------------------------------+---------------------------------+-----------------+-----------+-----------------
a0000000-0000-0000-0000-000000000001 | admin@circletel.co.za          | super_admin     | true      | ✅ Exists
a0000000-0000-0000-0000-000000000002 | product.manager@circletel.co.za| product_manager | true      | ✅ Exists
a0000000-0000-0000-0000-000000000003 | editor@circletel.co.za         | editor          | true      | ✅ Exists
a0000000-0000-0000-0000-000000000004 | viewer@circletel.co.za         | viewer          | true      | ✅ Exists
```

### 2. Test Login via Dashboard

1. Go to https://circletel-staging.vercel.app/admin/login
2. Try logging in with each account:
   - admin@circletel.co.za / admin123
   - product.manager@circletel.co.za / pm123
   - editor@circletel.co.za / editor123
   - viewer@circletel.co.za / viewer123

### 3. Check Supabase Auth Dashboard

1. Go to Supabase Dashboard → Authentication → Users
2. All 4 users should be listed
3. All should have "Confirmed" status ✅
4. Click each user to verify:
   - Email matches
   - UUID matches admin_users table
   - No "Email not confirmed" warning

---

## Troubleshooting

### Issue: "User ID already exists"

**Cause:** You're trying to create a user with a UUID that already exists.

**Solution:**
1. Check existing users in Supabase Dashboard → Authentication → Users
2. Delete the conflicting user
3. Try again with the correct UUID

### Issue: "Email already registered"

**Cause:** An auth user exists with that email but different UUID.

**Solution:**
1. Delete the existing user from Supabase Auth
2. Recreate with the correct UUID from migration

### Issue: Login works on staging but fails on production

**Cause:** Production requires real Supabase Auth users (no dev mode).

**Solution:**
1. Verify you created users with Method 1 or 2 above
2. Check that UUIDs match between auth.users and admin_users tables
3. Ensure users have "Confirmed" status

### Issue: "User is not an admin or account is inactive"

**Cause:** User exists in auth.users but not in admin_users, or is_active = false.

**Solution:**
```sql
-- Check if user exists in admin_users
SELECT * FROM admin_users WHERE email = 'admin@circletel.co.za';

-- If missing, insert manually
INSERT INTO admin_users (id, email, full_name, role, permissions, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'admin@circletel.co.za',
  'Admin User',
  'super_admin',
  '{"all": true}'::jsonb,
  true
);

-- If inactive, activate
UPDATE admin_users
SET is_active = true
WHERE email = 'admin@circletel.co.za';
```

### Issue: UUID Mismatch

**Cause:** Supabase generated a different UUID than specified.

**Solution:**
You have two options:

**Option A: Update admin_users to match Supabase Auth**
```sql
-- Get the correct UUID from Supabase Auth dashboard
-- Then update admin_users
UPDATE admin_users
SET id = 'actual-uuid-from-supabase'::uuid
WHERE email = 'admin@circletel.co.za';
```

**Option B: Delete and recreate with correct UUID**
1. Delete user from Supabase Auth dashboard
2. Recreate using Method 1, ensuring UUID is entered correctly

---

## Security Recommendations

After setting up production users:

### 1. Change Default Passwords

For production use, change these test passwords:

```sql
-- Users should change via password reset flow, but you can update via Dashboard:
-- Supabase Dashboard → Authentication → Users → [Select User] → "Reset Password"
```

Or use the password reset email flow in your app.

### 2. Enable Additional Security

In Supabase Dashboard → Authentication → Settings:

- [ ] Enable email confirmations (for new signups)
- [ ] Set session timeout (e.g., 24 hours)
- [ ] Enable password requirements:
  - Minimum length: 12 characters
  - Require uppercase
  - Require numbers
  - Require special characters

### 3. Rotate Service Role Key

After running any scripts:
1. Store service role key in environment variables (never commit to git)
2. Consider rotating the key if it was exposed
3. Use least-privilege keys when possible

---

## Next Steps

After creating users:

1. ✅ Test login on staging environment
2. ✅ Verify role-based permissions work correctly
3. ✅ Document password change process for real users
4. ✅ Set up password reset flow
5. ✅ Create process for approving new admin access requests
6. ✅ Configure email notifications for access requests

---

## Quick Reference

### Test Account Summary

| Email | Password | Role | UUID |
|-------|----------|------|------|
| admin@circletel.co.za | admin123 | super_admin | a0000000-0000-0000-0000-000000000001 |
| product.manager@circletel.co.za | pm123 | product_manager | a0000000-0000-0000-0000-000000000002 |
| editor@circletel.co.za | editor123 | editor | a0000000-0000-0000-0000-000000000003 |
| viewer@circletel.co.za | viewer123 | viewer | a0000000-0000-0000-0000-000000000004 |

### Important URLs

- **Supabase Dashboard:** https://supabase.com/dashboard/project/agyjovdugmtopasyvlng
- **Authentication Users:** https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/auth/users
- **SQL Editor:** https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql
- **Staging Login:** https://circletel-staging.vercel.app/admin/login
- **Staging Signup:** https://circletel-staging.vercel.app/admin/signup

### Useful SQL Queries

```sql
-- List all admin users with auth status
SELECT
  au.email,
  au.role,
  au.is_active,
  u.email_confirmed_at,
  u.last_sign_in_at
FROM admin_users au
LEFT JOIN auth.users u ON u.id = au.id;

-- Check if auth user exists
SELECT id, email, email_confirmed_at
FROM auth.users
WHERE email = 'admin@circletel.co.za';

-- Activate an admin user
UPDATE admin_users SET is_active = true WHERE email = 'admin@circletel.co.za';

-- View recent admin activity
SELECT * FROM admin_activity_log
ORDER BY created_at DESC
LIMIT 20;
```

---

## Support

If you encounter issues not covered in this guide:

1. Check [Admin Auth Setup Guide](../admin-auth-setup.md)
2. Review Supabase Auth logs in Dashboard
3. Check browser console for errors
4. Review Edge Function logs
5. Contact system administrator

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Admin User Management](https://supabase.com/docs/guides/auth/managing-user-data)
- [Password Reset Flow](https://supabase.com/docs/guides/auth/auth-password-reset)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
