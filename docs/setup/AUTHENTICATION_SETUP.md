# Production Authentication Setup Guide

This guide explains how to set up production-ready Supabase authentication for the CircleTel admin panel with full audit trail support.

## Overview

The authentication system uses:
- **Supabase Auth** for user authentication
- **admin_users** table for role-based access control (RBAC)
- **admin_activity_log** table for activity tracking
- **product_audit_logs** table for price change auditing
- **Supabase Edge Function** for admin authentication logic

## Database Setup

### 1. Admin Users Table

The migration creates the following tables:

#### `admin_users`
Stores admin user information with roles and permissions:

```sql
- id: UUID (primary key)
- email: TEXT (unique)
- full_name: TEXT
- role: TEXT (super_admin | product_manager | editor | viewer)
- permissions: JSONB
- is_active: BOOLEAN
- last_login: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

**Roles:**
- `super_admin`: Full access to all features
- `product_manager`: Can manage products and approve changes
- `editor`: Can edit products but needs approval
- `viewer`: Read-only access

#### `admin_activity_log`
Tracks all admin actions for compliance:

```sql
- id: UUID
- admin_user_id: UUID (references admin_users)
- action: TEXT
- resource_type: TEXT
- resource_id: TEXT
- details: JSONB
- ip_address: INET
- user_agent: TEXT
- created_at: TIMESTAMPTZ
```

### 2. Row Level Security (RLS)

The tables have comprehensive RLS policies:

- Admins can view their own records
- Super admins can view/manage all admin users
- Activity logs visible to user's own actions + super admins see all
- Product audit logs accessible based on permissions

## Supabase Edge Function

### Location
`supabase/functions/admin-auth/index.ts`

### Endpoints

#### POST /admin-auth (Login)
**Request:**
```json
{
  "email": "admin@circletel.co.za",
  "password": "secure_password"
}
```

**Response (Success):**
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@circletel.co.za",
    "full_name": "Admin User",
    "role": "super_admin",
    "permissions": {},
    "is_active": true,
    "last_login": "2025-01-31T10:00:00Z"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_at": 1234567890,
    "expires_in": 3600
  }
}
```

#### POST /admin-auth (Session Validation)
**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (Success):**
```json
{
  "valid": true,
  "user": {
    "id": "uuid",
    "email": "admin@circletel.co.za",
    "full_name": "Admin User",
    "role": "super_admin",
    "permissions": {},
    "is_active": true
  }
}
```

## Deployment Steps

### Step 1: Deploy Edge Function

```bash
# Login to Supabase CLI
supabase login

# Link to your project
supabase link --project-ref agyjovdugmtopasyvlng

# Deploy the edge function
supabase functions deploy admin-auth

# Set environment variables for the function
supabase secrets set SUPABASE_URL=https://agyjovdugmtopasyvlng.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 2: Create Admin User in Supabase Auth

The migration automatically creates an admin user record in the `admin_users` table, but you need to create the corresponding auth user:

**Option A: Via Supabase Dashboard**
1. Go to Authentication → Users
2. Click "Add User"
3. Email: `admin@circletel.co.za`
4. Password: Choose a secure password
5. Copy the generated user UUID

**Option B: Via SQL**
```sql
-- This creates the auth user and automatically generates a UUID
-- You'll need to use the Supabase dashboard or API for password
```

### Step 3: Link Auth User to Admin User

```sql
-- Update the admin_users record with the correct UUID from Supabase Auth
UPDATE admin_users
SET id = 'auth_user_uuid_here'
WHERE email = 'admin@circletel.co.za';
```

### Step 4: Test Authentication

**Development Mode:**
- Email: `admin@circletel.co.za`
- Password: `admin123` (mock credentials)

**Production Mode:**
- Email: `admin@circletel.co.za`
- Password: Your secure password from Step 2

## Environment Variables

### Required Variables

Add to your `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://agyjovdugmtopasyvlng.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Node Environment
NODE_ENV=production
```

## Frontend Integration

### Login Flow

The frontend uses `useAdminAuth` hook:

```typescript
import { useAdminAuth } from '@/hooks/useAdminAuth'

function LoginPage() {
  const { login, isLoading, error } = useAdminAuth()

  const handleLogin = async (email: string, password: string) => {
    try {
      const user = await login(email, password)
      // Redirect to admin dashboard
    } catch (err) {
      // Show error message
    }
  }
}
```

### Protected Routes

The admin layout automatically validates sessions:

```typescript
// app/admin/layout.tsx
export default function AdminLayout({ children }) {
  const { user, isLoading } = useAdminAuth()

  if (!user) {
    // Redirects to /admin/login
    return null
  }

  return <AdminDashboard>{children}</AdminDashboard>
}
```

## API Routes Authentication

All admin API routes use the auth utility:

```typescript
import { getAuthenticatedUser } from '@/lib/auth/api-auth'

export async function PUT(request: NextRequest) {
  // Get authenticated user from session
  const user = await getAuthenticatedUser(request)

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Use user.email and user.full_name for audit logs
  // ...
}
```

## Audit Trail Integration

### Automatic Audit Logging

Price changes are automatically logged with user attribution:

```typescript
// Database trigger creates audit log entry
// API enriches it with user information

await supabase
  .from('product_audit_logs')
  .update({
    changed_by_email: user.email,
    changed_by_name: user.full_name,
    change_reason: 'Price updated for Q1 promotion',
    ip_address: request.headers.get('x-forwarded-for'),
    user_agent: request.headers.get('user-agent')
  })
```

### Activity Logging

Admin actions are logged automatically:

```sql
-- Call from API routes
SELECT log_admin_activity(
  'product_update',
  'products',
  'product_uuid',
  '{"field": "price", "old": 1299, "new": 1399}'::jsonb,
  '192.168.1.1'::inet,
  'Mozilla/5.0...'
);
```

## Security Features

### Session Management
- ✅ HTTP-only cookies (server-side only)
- ✅ Automatic token refresh
- ✅ Secure session validation

### Role-Based Access
- ✅ Database-level permission checks
- ✅ API route protection
- ✅ Frontend role validation

### Audit Trail
- ✅ Complete who/when/what/why tracking
- ✅ IP address logging
- ✅ User agent tracking
- ✅ Mandatory change reasons

### Data Protection
- ✅ Row Level Security on all tables
- ✅ Service role key for admin operations
- ✅ Encrypted sessions
- ✅ Secure password hashing

## Troubleshooting

### Issue: "Unauthorized" on API calls
**Solution:** Check that the user's session is valid and the admin_users record exists with is_active = true

### Issue: Edge function not found
**Solution:** Deploy the edge function: `supabase functions deploy admin-auth`

### Issue: "Admin user not found"
**Solution:** Ensure the auth user UUID matches the admin_users table ID

### Issue: Development login not working
**Solution:** Use `admin@circletel.co.za` / `admin123` in development mode

## Admin User Management

### Create New Admin User

```sql
-- 1. Create user in Supabase Auth (via dashboard)
-- 2. Add to admin_users table
INSERT INTO admin_users (id, email, full_name, role, is_active)
VALUES (
  'auth_user_uuid',
  'newadmin@circletel.co.za',
  'New Admin',
  'product_manager',
  true
);
```

### Update User Role

```sql
UPDATE admin_users
SET role = 'super_admin'
WHERE email = 'admin@circletel.co.za';
```

### Deactivate User (Soft Delete)

```sql
UPDATE admin_users
SET is_active = false
WHERE email = 'admin@circletel.co.za';
```

## Monitoring

### View Recent Admin Activity

```sql
SELECT
  au.email,
  au.full_name,
  aal.action,
  aal.resource_type,
  aal.created_at
FROM admin_activity_log aal
JOIN admin_users au ON aal.admin_user_id = au.id
ORDER BY aal.created_at DESC
LIMIT 50;
```

### View Product Price Changes

```sql
SELECT
  p.name as product_name,
  pal.old_values->>'base_price_zar' as old_price,
  pal.new_values->>'base_price_zar' as new_price,
  pal.changed_by_name,
  pal.changed_by_email,
  pal.change_reason,
  pal.changed_at
FROM product_audit_logs pal
JOIN products p ON pal.product_id = p.id
WHERE pal.action = 'UPDATE'
  AND 'base_price_zar' = ANY(pal.changed_fields)
ORDER BY pal.changed_at DESC;
```

### View Active Sessions

```sql
SELECT
  email,
  full_name,
  role,
  last_login,
  CASE
    WHEN last_login > NOW() - INTERVAL '1 hour' THEN 'Active'
    ELSE 'Inactive'
  END as status
FROM admin_users
WHERE is_active = true
ORDER BY last_login DESC;
```

## Next Steps

1. ✅ Deploy edge function to production
2. ✅ Create production admin users
3. ✅ Test authentication flow
4. ✅ Configure monitoring alerts
5. ✅ Set up backup procedures
6. ✅ Document incident response procedures

## Support

For issues or questions:
- Check logs: Supabase Dashboard → Logs → Edge Functions
- Review RLS policies: Database → Policies
- Verify user status: Authentication → Users
