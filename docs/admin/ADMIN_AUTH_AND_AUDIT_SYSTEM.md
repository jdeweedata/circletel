# Admin Authentication and Audit Logging System

**Date**: October 31, 2025
**Status**: ✅ Complete and Production Ready
**Version**: 1.0

## Overview

CircleTel's admin authentication system has been enhanced with a comprehensive audit logging system that tracks all admin activities, password resets, and security events with automatic suspicious activity detection.

---

## 🎨 Admin Auth Pages

### Login Page (`/admin/login`)

**Design**: Matches consumer auth page aesthetics with admin-specific features
- Gradient background (`bg-gradient-to-br from-gray-50 to-blue-50`)
- Centered white card with CircleTel branding
- Shield icon badge for admin identification
- Security notice banner
- "Forgot password?" link with enhanced security

**Features**:
- Email/password authentication
- Client-side validation with Zod schema
- Loading states during authentication
- Error messages for failed attempts
- Automatic redirect to dashboard on success

**File**: `app/admin/login/page.tsx`

### Signup Page (`/admin/signup`)

**Design**: Consistent with login page design
- Full name, email, password fields
- Role selection dropdown (grouped by department)
- Strong password requirements with visual indicators

**Features**:
- All 17 role templates available
- Grouped by department (Executive, Sales, Marketing, etc.)
- Shows role level (executive, management, specialist, etc.)
- Validation for all fields

**File**: `app/admin/signup/page.tsx`

### Password Reset Flow

#### 1. Forgot Password Page (`/admin/forgot-password`)

**Security Features**:
- Rate limiting (3 attempts per 15 minutes)
- Admin-specific security notice
- User enumeration protection (same message for all requests)
- Audit logging of all attempts

**Flow**:
1. User enters email address
2. System validates email exists in `admin_users` table
3. System checks if account is active
4. Password reset email sent via Supabase Auth
5. Audit log entry created with IP address and user agent

**Files**:
- Frontend: `app/admin/forgot-password/page.tsx`
- API: `app/api/admin/forgot-password/route.ts`

#### 2. Reset Password Page (`/admin/reset-password`)

**Security Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Password confirmation must match

**Flow**:
1. User receives email with reset token
2. Clicks link to `/admin/reset-password?code=TOKEN`
3. Enters new password (twice for confirmation)
4. System validates token and updates password
5. User redirected to login page

**File**: `app/admin/reset-password/page.tsx`

---

## 🔐 RBAC System Extensions

### New Executive Roles

1. **Chief Technology Officer (CTO)**
   - **Department**: Executive
   - **Level**: executive
   - **Permissions**: 25 permissions covering technology, systems, integrations, operations
   - **Icon**: Cpu
   - **Color**: slate

2. **Chief Marketing Officer (CMO)**
   - **Department**: Executive
   - **Level**: executive
   - **Permissions**: 17 permissions covering marketing, analytics, campaigns, leads
   - **Icon**: Sparkles
   - **Color**: pink

### New Management Roles

3. **General Manager**
   - **Department**: Management
   - **Level**: management
   - **Permissions**: 22 permissions covering cross-department oversight
   - **Icon**: Briefcase
   - **Color**: gray

4. **Department Manager**
   - **Department**: Management
   - **Level**: management
   - **Permissions**: 18 permissions for department-level management
   - **Icon**: Users
   - **Color**: teal

5. **Regional Manager**
   - **Department**: Management
   - **Level**: management
   - **Permissions**: 19 permissions for regional operations
   - **Icon**: Map
   - **Color**: emerald

### New Operations Roles

6. **Service Delivery Manager**
   - **Department**: Operations
   - **Level**: management
   - **Permissions**: 16 permissions for end-to-end service delivery
   - **Icon**: Truck
   - **Color**: blue

7. **Service Delivery Administrator**
   - **Department**: Operations
   - **Level**: specialist
   - **Permissions**: 14 permissions for service delivery execution
   - **Icon**: ClipboardList
   - **Color**: cyan

### Database Implementation

**Migrations**:
- `20251031000001_add_executive_manager_roles.sql` - First 5 roles
- `20251031000002_add_service_delivery_roles.sql` - Service Delivery roles

**Table**: `role_templates`

**Format**:
```sql
INSERT INTO public.role_templates (
  id, name, description, department, level, permissions, color, icon, is_default
) VALUES (
  'cto', 'Chief Technology Officer',
  'Full technology, systems, and integration management access',
  'Executive', 'executive',
  '["dashboard:view","system:view_logs",...]'::jsonb,
  'slate', 'Cpu', false
);
```

---

## 📊 Audit Logging System

### Database Schema

**Table**: `admin_audit_logs`

**Columns**:

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Reference to `auth.users` |
| `user_email` | TEXT | Email address (indexed) |
| `admin_user_id` | UUID | Reference to `admin_users` |
| `action` | TEXT | Specific action taken (e.g., `password_reset_requested`) |
| `action_category` | TEXT | Category: `authentication`, `password`, `user_management`, `system`, `data_access`, `configuration`, `security` |
| `ip_address` | TEXT | Client IP address (indexed) |
| `user_agent` | TEXT | Browser/client user agent |
| `request_method` | TEXT | HTTP method (POST, GET, etc.) |
| `request_path` | TEXT | API endpoint path |
| `metadata` | JSONB | Additional context data |
| `status` | TEXT | `success`, `failure`, `pending`, `warning` |
| `error_message` | TEXT | Error details if failed |
| `created_at` | TIMESTAMPTZ | Timestamp (indexed) |
| `is_suspicious` | BOOLEAN | Auto-flagged suspicious activity |
| `severity` | TEXT | `low`, `medium`, `high`, `critical` |

**Indexes**: 10 total for optimal query performance
- User lookups (user_id, admin_user_id, user_email)
- Action filtering (action, action_category)
- Time-based queries (created_at)
- Security monitoring (is_suspicious, severity)
- IP tracking (ip_address)
- Composite (user_id + action + created_at)

### Row Level Security (RLS)

**Policies**:

1. **Super admins can view all audit logs**
   - Type: SELECT
   - Condition: User is active super admin in `admin_users` table

2. **Service role can insert audit logs**
   - Type: INSERT
   - Condition: Always allowed for service role (used by API routes)

### Helper Functions

#### `log_admin_action()`

**Purpose**: Simplified function to create audit log entries

**Parameters**:
```sql
p_user_id UUID,
p_user_email TEXT,
p_action TEXT,
p_action_category TEXT,
p_ip_address TEXT DEFAULT NULL,
p_user_agent TEXT DEFAULT NULL,
p_metadata JSONB DEFAULT '{}'::jsonb,
p_status TEXT DEFAULT 'success',
p_severity TEXT DEFAULT 'low'
```

**Returns**: UUID (audit log ID)

**Usage**:
```sql
SELECT log_admin_action(
  auth.uid(),
  'admin@circletel.co.za',
  'password_reset_requested',
  'password',
  '192.168.1.1',
  'Mozilla/5.0',
  '{"reason": "forgot_password"}'::jsonb,
  'success',
  'medium'
);
```

#### `detect_suspicious_activity()`

**Purpose**: Automatic suspicious activity detection (trigger function)

**Detection Rules**:

1. **Multiple Failures** (HIGH severity):
   - 3+ failed authentication/password attempts
   - Within 15-minute window
   - Same user email

2. **Multiple IPs** (MEDIUM severity):
   - 3+ different IP addresses
   - Within 5-minute window
   - Same user email

**Execution**: Runs automatically BEFORE INSERT on `admin_audit_logs`

**Effect**: Sets `is_suspicious = true` and adjusts `severity` level

### View: `v_admin_audit_logs_recent`

**Purpose**: Optimized view for common queries

**Features**:
- Joins with `admin_users` to get full names
- Filters to last 30 days only
- Ordered by most recent first

**Columns**:
- id, user_email, full_name
- action, action_category
- status, severity, is_suspicious
- ip_address, created_at, metadata

**Usage**:
```sql
SELECT * FROM v_admin_audit_logs_recent
WHERE action_category = 'password'
ORDER BY created_at DESC
LIMIT 100;
```

---

## 🖥️ Audit Logs UI

### Page: `/admin/audit-logs`

**Access**: Super admins only (enforced via RBAC)

**Features**:

#### 1. Stats Cards (4 total)

- **Total Events**: Count of all filtered logs
- **Suspicious Activity**: Count of flagged entries (orange)
- **Failed Actions**: Count of failure status (red)
- **High Severity**: Count of high/critical severity (orange)

#### 2. Filters

**Search Bar**:
- Search by email, action, or IP address
- Real-time filtering (client-side)

**Category Filter**:
- All Categories
- Authentication
- Password
- User Management
- System
- Data Access
- Configuration
- Security

**Status Filter**:
- All Statuses
- Success
- Failure
- Pending
- Warning

#### 3. Audit Logs Table

**Columns**: 7 total
1. Status (icon: success ✓, failure ✗, pending ⏱)
2. User (full name + email)
3. Action (with suspicious badge if flagged)
4. Category (color-coded badge)
5. Severity (color-coded badge)
6. IP Address
7. Time (formatted timestamp)

**Features**:
- Hover effect on rows
- Red background for suspicious activity
- Color-coded badges for visual clarity
- Responsive design (horizontal scroll on mobile)

**File**: `app/admin/audit-logs/page.tsx`

---

## 🔒 Security Features

### Rate Limiting

**Implementation**: In-memory Map (development)
- **Window**: 15 minutes
- **Max Attempts**: 3 password reset requests per email
- **Action**: Returns 429 Too Many Requests
- **Audit**: Logs rate limit violations as `password_reset_rate_limited` with HIGH severity

**Production Recommendation**: Use Redis for distributed rate limiting

**Code Location**: `app/api/admin/forgot-password/route.ts:16-76`

### User Enumeration Protection

**Strategy**: Same response message for all scenarios
- Email exists → "If an admin account exists..."
- Email doesn't exist → "If an admin account exists..."
- Account inactive → "If an admin account exists..."
- Internal error → "If an admin account exists..."

**Benefit**: Prevents attackers from discovering valid admin email addresses

**Code Location**: `app/api/admin/forgot-password/route.ts:85-122`

### IP Address Tracking

**Extraction**:
```typescript
const ipAddress =
  request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
  request.headers.get('x-real-ip') ||
  'unknown';
```

**Headers Checked**:
1. `x-forwarded-for` (proxy/load balancer)
2. `x-real-ip` (direct connection)
3. Fallback to 'unknown'

**Storage**: Stored in `admin_audit_logs.ip_address` for all actions

### User Agent Tracking

**Extraction**:
```typescript
const userAgent = request.headers.get('user-agent') || 'unknown';
```

**Purpose**:
- Identify client type (browser, mobile app, script)
- Detect suspicious automation attempts
- Forensic investigation

---

## 📝 Integration Examples

### Password Reset API with Audit Logging

```typescript
// app/api/admin/forgot-password/route.ts

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  const supabase = await createClient();

  // ... validation and rate limiting ...

  // Send password reset email
  await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/admin/reset-password`,
  });

  // Log the password reset request
  await supabase.from('admin_audit_logs').insert({
    user_id: adminUser.id,
    user_email: normalizedEmail,
    admin_user_id: adminUser.id,
    action: 'password_reset_requested',
    action_category: 'password',
    ip_address: ipAddress,
    user_agent: userAgent,
    request_method: 'POST',
    request_path: '/api/admin/forgot-password',
    metadata: {
      email: normalizedEmail,
      role: adminUser.role,
      role_template_id: adminUser.role_template_id,
    },
    status: 'success',
    severity: 'medium',
  });

  return NextResponse.json({
    success: true,
    message: 'If an admin account exists with this email, password reset instructions have been sent.',
  });
}
```

### Rate Limit Violation Audit Logging

```typescript
// Log rate limit violation
await supabase.from('admin_audit_logs').insert({
  user_email: normalizedEmail,
  action: 'password_reset_rate_limited',
  action_category: 'security',
  ip_address: ipAddress,
  user_agent: userAgent,
  request_method: 'POST',
  request_path: '/api/admin/forgot-password',
  metadata: { attempts: attempts.count },
  status: 'failure',
  severity: 'high',
});
```

---

## 🧪 Testing

### Verification Scripts

#### 1. Apply and Verify Migration
```bash
node scripts/apply-audit-logs-migration.js
```

**Output**:
- ✅ Table exists confirmation
- ✅ View exists confirmation
- Migration verification status

#### 2. Verify Table Structure
```bash
node scripts/verify-audit-logs-table.js
```

**Output**:
- ✅ Table structure verified
- 📊 Recent audit log entries (if any)
- ℹ️ Guidance if no entries found

#### 3. Test Password Reset Audit Logging
```bash
# Start dev server first
npm run dev

# In another terminal
node scripts/test-password-reset-audit.js
```

**Output**:
- 📧 Password reset request sent
- 📥 API response
- 🔍 Audit log verification
- ✅ Test result (PASSED/FAILED)

### Manual Testing

#### Test Password Reset Flow

1. **Navigate to login page**: `http://localhost:3000/admin/login`
2. **Click "Forgot password?"**: Should navigate to `/admin/forgot-password`
3. **Enter email**: Use `jeffrey.de.wee@circletel.co.za` (super admin account)
4. **Submit form**: Should see success message
5. **Check email**: Password reset link in inbox
6. **Verify audit log**: Navigate to `/admin/audit-logs` and verify entry

#### Test Rate Limiting

1. **Send 4 password reset requests** in quick succession
2. **First 3**: Should succeed (but only 1 email sent)
3. **4th request**: Should return 429 error
4. **Check audit logs**: Should see rate limit violation logged

#### Test Suspicious Activity Detection

1. **Send 3 failed login attempts** (once login audit logging is implemented)
2. **Check audit logs**: 3rd attempt should be flagged as suspicious
3. **Verify flags**: `is_suspicious = true`, `severity = high`

---

## 📦 Files Created/Modified

### New Files Created

| File | Purpose |
|------|---------|
| `app/admin/forgot-password/page.tsx` | Password reset request page |
| `app/admin/reset-password/page.tsx` | Password reset form page |
| `app/api/admin/forgot-password/route.ts` | Password reset API endpoint |
| `app/admin/audit-logs/page.tsx` | Audit logs viewing interface |
| `supabase/migrations/20251031000001_add_executive_manager_roles.sql` | Executive and manager roles |
| `supabase/migrations/20251031000002_add_service_delivery_roles.sql` | Service delivery roles |
| `supabase/migrations/20251031000003_create_admin_audit_logs.sql` | Audit logging system |
| `scripts/create-super-admin.js` | Super admin account creation script |
| `scripts/verify-new-roles.js` | Role verification script |
| `scripts/apply-audit-logs-migration.js` | Migration verification script |
| `scripts/verify-audit-logs-table.js` | Table structure verification script |
| `scripts/test-password-reset-audit.js` | Password reset audit test script |

### Files Modified

| File | Changes |
|------|---------|
| `app/admin/login/page.tsx` | Complete redesign to match consumer auth |
| `app/admin/signup/page.tsx` | Changed to dropdown role selection |
| `app/admin/layout.tsx` | Fixed React render error with useEffect |
| `lib/rbac/role-templates.ts` | Added 7 new role templates |
| `components/rbac/RoleTemplateSelector.tsx` | Added missing icon imports |

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [x] All migrations applied to database
- [x] Audit logs table created with indexes
- [x] RLS policies enabled and tested
- [x] Trigger functions working correctly
- [x] View created for common queries
- [x] Super admin account created
- [x] Password reset flow tested end-to-end
- [x] Audit logging tested and verified
- [x] TypeScript compilation passes
- [x] No console errors in browser

### Post-Deployment

- [ ] Verify password reset emails are being sent
- [ ] Test rate limiting in production
- [ ] Monitor audit logs for suspicious activity
- [ ] Configure alerts for high-severity events
- [ ] Set up log retention policy (currently 30 days in view)
- [ ] Consider implementing Redis rate limiting
- [ ] Set up automated audit log exports for compliance

---

## 📚 Related Documentation

- **RBAC System**: `docs/rbac/RBAC_SYSTEM_GUIDE.md`
- **Admin Dashboard**: `docs/admin/ADMIN_DASHBOARD_GUIDE.md`
- **Supabase Schema**: `supabase/migrations/`
- **API Routes**: `app/api/admin/`

---

## 🎯 Future Enhancements

### Short Term
- [ ] Implement login audit logging (currently only password resets)
- [ ] Add logout audit logging
- [ ] Email notifications for suspicious activity
- [ ] Audit log export functionality (CSV/JSON)

### Medium Term
- [ ] Redis-based distributed rate limiting
- [ ] Audit log retention policy configuration
- [ ] Advanced filtering (date ranges, metadata search)
- [ ] Audit log analytics dashboard

### Long Term
- [ ] Machine learning for anomaly detection
- [ ] Real-time suspicious activity alerts
- [ ] Automated response to security threats
- [ ] Compliance reporting (POPIA, GDPR)

---

**Last Updated**: October 31, 2025
**Author**: CircleTel Development Team
**Version**: 1.0
**Status**: ✅ Production Ready
