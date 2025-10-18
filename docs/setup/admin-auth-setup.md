# Admin Authentication System Setup Guide

This guide explains how to set up and use the CircleTel admin authentication system.

## Overview

The admin authentication system uses:
- **Supabase Auth** for user authentication
- **Admin Users Table** for role-based access control
- **Pending Admin Users** for access request workflow
- **Edge Functions** for secure auth operations

## Architecture

### Best Practices Implemented

1. **Approval Workflow**: New users request access, super admins approve
2. **Role-Based Access Control (RBAC)**: Four roles with granular permissions
3. **Secure Authentication**: Supabase Auth with JWT tokens
4. **Activity Logging**: All admin actions tracked
5. **Development Mode**: Mock authentication for local development

### User Roles

| Role | Permissions | Use Case |
|------|-------------|----------|
| **super_admin** | All permissions, can approve users | System administrators |
| **product_manager** | Full product/coverage management | Product team leads |
| **editor** | Create and edit content | Content editors |
| **viewer** | Read-only access | Stakeholders, auditors |

## Setup Instructions

### 1. Database Setup

Run the Supabase migrations:

```bash
# Navigate to your project root
cd circletel-nextjs

# Apply migrations (requires Supabase CLI)
supabase db push
```

Migrations applied:
- `20250131000001_create_admin_users.sql` - Admin users table with RLS
- `20250201000003_create_pending_admin_users.sql` - Access request workflow
- `20250201000004_add_test_admin_account.sql` - Test accounts

### 2. Create Supabase Auth Users

**Option A: Using Supabase Dashboard (Recommended for initial setup)**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication** > **Users**
3. Click **Add user** > **Create new user**
4. Create users with these credentials:

| Email | Password | Role | User ID |
|-------|----------|------|---------|
| admin@circletel.co.za | admin123 | super_admin | a0000000-0000-0000-0000-000000000001 |
| product.manager@circletel.co.za | pm123 | product_manager | a0000000-0000-0000-0000-000000000002 |
| editor@circletel.co.za | editor123 | editor | a0000000-0000-0000-0000-000000000003 |
| viewer@circletel.co.za | viewer123 | viewer | a0000000-0000-0000-0000-000000000004 |

**Important**: Make sure the User ID matches the ID in the `admin_users` table migration.

**Option B: Using Supabase Admin API**

```typescript
// Example: Create admin user via API
const { data, error } = await supabase.auth.admin.createUser({
  email: 'admin@circletel.co.za',
  password: 'admin123',
  email_confirm: true,
  user_metadata: {
    full_name: 'Test Admin User'
  }
})
```

### 3. Deploy Edge Functions

```bash
# Deploy admin-auth function
supabase functions deploy admin-auth

# Deploy admin-signup function
supabase functions deploy admin-signup
```

### 4. Test Authentication

#### Development Mode (Local)
In development, the system uses mock authentication:
- Email: `admin@circletel.co.za`
- Password: `admin123`

#### Production Mode
Production uses real Supabase authentication with the credentials created in Step 2.

## User Workflows

### For New Users (Requesting Access)

1. Visit `/admin/signup`
2. Fill in the form:
   - Email (work email)
   - Full Name
   - Requested Role (viewer, editor, or product_manager)
   - Reason for access (optional)
3. Submit request
4. Wait for super admin approval (typically 1-2 business days)
5. Receive email notification when approved
6. Login at `/admin/login`

### For Super Admins (Approving Access)

1. Login to admin panel
2. Navigate to **Admin** > **Access Requests** (TODO: Create this page)
3. Review pending requests
4. Approve or reject with reason
5. System creates Supabase Auth account on approval
6. User receives notification email

### For All Users (Logging In)

1. Visit `/admin/login`
2. Enter email and password
3. Click "Sign In"
4. Redirected to admin dashboard

## API Endpoints

### Edge Functions

#### `admin-auth` - Login & Session Validation

**Login**
```bash
POST /functions/v1/admin-auth
Content-Type: application/json

{
  "email": "admin@circletel.co.za",
  "password": "admin123"
}
```

Response:
```json
{
  "user": {
    "id": "...",
    "email": "admin@circletel.co.za",
    "full_name": "Test Admin User",
    "role": "super_admin",
    "permissions": { "all": true },
    "is_active": true
  },
  "session": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_at": 1234567890,
    "expires_in": 3600
  }
}
```

**Session Validation**
```bash
POST /functions/v1/admin-auth
Authorization: Bearer {access_token}
```

#### `admin-signup` - Request Access

```bash
POST /functions/v1/admin-signup
Content-Type: application/json

{
  "email": "newuser@circletel.co.za",
  "full_name": "New User",
  "requested_role": "viewer",
  "reason": "Need access for reporting"
}
```

Response:
```json
{
  "success": true,
  "message": "Access request submitted successfully",
  "request_id": "..."
}
```

## Testing

### Test Accounts

#### Development Mode (No Supabase required)
- Email: `admin@circletel.co.za`
- Password: `admin123`
- Role: super_admin

#### Production Mode (Requires Supabase setup)

| Email | Password | Role |
|-------|----------|------|
| admin@circletel.co.za | admin123 | super_admin |
| product.manager@circletel.co.za | pm123 | product_manager |
| editor@circletel.co.za | editor123 | editor |
| viewer@circletel.co.za | viewer123 | viewer |

### Manual Testing Checklist

- [ ] Signup page loads at `/admin/signup`
- [ ] Login page loads at `/admin/login`
- [ ] Can request access via signup form
- [ ] Login works with test credentials
- [ ] Redirects to dashboard after login
- [ ] Protected routes redirect to login when not authenticated
- [ ] Logout works and redirects to login
- [ ] Session persists across page reloads
- [ ] Invalid credentials show error message

## Security Considerations

### Row Level Security (RLS)

All tables have RLS enabled:
- **admin_users**: Users can read own record, super admins can manage all
- **pending_admin_users**: Users can view own requests, super admins can manage all
- **admin_activity_log**: Users can view own activity, super admins can view all

### Password Requirements

For production:
- Minimum 8 characters
- Mix of uppercase, lowercase, numbers
- Consider implementing password strength meter

### Session Management

- Access tokens expire after 1 hour
- Refresh tokens used for automatic renewal
- Sessions validated on protected route access
- Logout clears both client and server sessions

## Troubleshooting

### "Invalid credentials" error

**Development Mode:**
- Make sure you're using `admin@circletel.co.za` / `admin123`

**Production Mode:**
- Verify user exists in Supabase Auth dashboard
- Check that admin_users record exists with matching ID
- Ensure `is_active = true` in admin_users table
- Check Edge Function logs in Supabase dashboard

### "User is not an admin" error

- User exists in Supabase Auth but not in `admin_users` table
- Solution: Run migration or manually insert admin_users record

### Signup not working

- Check Edge Function logs
- Verify `admin-signup` function is deployed
- Check CORS settings in Edge Function

### Session not persisting

- Check browser localStorage for session data
- Verify `validateSession` is being called in layout
- Check for console errors related to auth

## Future Enhancements

- [ ] Email notifications for access requests
- [ ] Password reset flow
- [ ] Two-factor authentication (2FA)
- [ ] Admin access request management UI
- [ ] Activity log viewer
- [ ] Password strength requirements
- [ ] Account lockout after failed attempts
- [ ] Session timeout warnings

## Support

For issues or questions:
1. Check Supabase Edge Function logs
2. Review browser console for errors
3. Check admin_activity_log table for audit trail
4. Contact system administrator

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
