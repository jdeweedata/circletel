# Login & Logout Audit Logging

**Date**: October 31, 2025
**Status**: ✅ Complete and Production Ready
**Version**: 1.0

## Overview

All admin login and logout attempts are now automatically tracked in the audit logs system. This provides a comprehensive security trail for monitoring access to the admin portal.

---

## 🔐 Features

### Login Audit Logging

**Successful Logins**:
- Action: `login_success`
- Category: `authentication`
- Severity: `low`
- Tracks: User ID, email, role, IP address, user agent

**Failed Logins**:
- Action: `login_failed` (wrong credentials)
- Action: `login_failed_not_admin` (not in admin_users table)
- Action: `login_failed_inactive_account` (account disabled)
- Category: `authentication`
- Severity: `medium` (wrong credentials), `high` (not admin), `medium` (inactive)
- Tracks: Email, IP address, user agent, error details

### Logout Audit Logging

**Successful Logouts**:
- Action: `logout_success`
- Category: `authentication`
- Severity: `low`
- Tracks: User ID, email, role, IP address, user agent

---

## 📁 Implementation Files

### API Routes

#### `/api/admin/login` (POST)
**File**: `app/api/admin/login/route.ts`

**Flow**:
1. Validates email and password are provided
2. Authenticates with Supabase Auth
3. Verifies user exists in `admin_users` table
4. Checks if account is active
5. Logs the login attempt (success or failure)
6. Returns session tokens on success

**Audit Actions**:
- `login_failed` - Invalid credentials
- `login_failed_not_admin` - User not in admin_users table
- `login_failed_inactive_account` - Account is disabled
- `login_success` - Successful authentication

**Security Features**:
- IP address tracking (x-forwarded-for, x-real-ip)
- User agent tracking
- Error details logged for failed attempts
- Automatic sign-out if not an admin user
- Automatic sign-out if account is inactive

#### `/api/admin/logout` (POST)
**File**: `app/api/admin/logout/route.ts`

**Flow**:
1. Gets current user info before logout
2. Signs out from Supabase Auth
3. Logs the logout action
4. Returns success message

**Audit Action**:
- `logout_success` - Successful logout

---

## 🖥️ Login Page

### File: `app/admin/login/page.tsx`

**Changes**:
- ✅ Removed test credentials display from UI
- ✅ Updated to use `/api/admin/login` endpoint
- ✅ All login attempts now logged automatically

**Test Credentials** (Development Only):
- Email: `admin@circletel.co.za`
- Password: `admin123`
- **Note**: Credentials still exist in database for testing, just not displayed on UI

**Login Flow**:
1. User enters email and password
2. Form validation (Zod schema)
3. POST request to `/api/admin/login` with credentials
4. API authenticates and logs attempt
5. On success: Redirect to `/admin` dashboard
6. On failure: Display error message

**Security**:
- No credentials displayed on page (removed in this update)
- All attempts logged with IP and user agent
- Failed attempts trigger suspicious activity detection after 3 attempts

---

## 🧪 Testing

### Verification Scripts

#### 1. Verify Test Admin Account
```bash
node scripts/verify-test-admin-account.js
```

**Output**:
- ✅ Confirms account exists in `admin_users` table
- ✅ Confirms account exists in `auth.users` table
- 📋 Shows account details (email, role, status)
- ⚠️  Displays test credentials with warning

#### 2. Test Login Audit Logging
```bash
# Start dev server first
npm run dev

# In another terminal
node scripts/test-admin-login-audit.js
```

**Test Suite**:
1. **Test 1**: Failed login attempt (wrong password)
   - Should return 401 Unauthorized
   - Should log `login_failed` action

2. **Test 2**: Successful login attempt (correct password)
   - Should return 200 OK with user data
   - Should log `login_success` action

3. **Test 3**: Verify audit logs created
   - Queries audit logs for both actions
   - Displays recent entries with full details
   - Confirms IP and user agent tracking

**Expected Output**:
```
✅ Login Audit Logging Test PASSED

Summary:
  ✅ Failed login attempts are logged
  ✅ Successful logins are logged
  ✅ IP addresses are tracked
  ✅ User agents are tracked
  ✅ Suspicious activity detection is working
```

---

## 📊 Audit Log Details

### Login Success Entry

```json
{
  "user_id": "uuid",
  "user_email": "admin@circletel.co.za",
  "admin_user_id": "uuid",
  "action": "login_success",
  "action_category": "authentication",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "request_method": "POST",
  "request_path": "/api/admin/login",
  "metadata": {
    "email": "admin@circletel.co.za",
    "role": "super_admin",
    "role_template_id": "super_admin",
    "full_name": "Admin User"
  },
  "status": "success",
  "severity": "low",
  "is_suspicious": false,
  "created_at": "2025-10-31T12:00:00Z"
}
```

### Login Failure Entry

```json
{
  "user_email": "admin@circletel.co.za",
  "action": "login_failed",
  "action_category": "authentication",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "request_method": "POST",
  "request_path": "/api/admin/login",
  "metadata": {
    "error": "Invalid credentials",
    "email": "admin@circletel.co.za"
  },
  "status": "failure",
  "severity": "medium",
  "is_suspicious": false,
  "created_at": "2025-10-31T12:00:00Z"
}
```

### Logout Entry

```json
{
  "user_id": "uuid",
  "user_email": "admin@circletel.co.za",
  "admin_user_id": "uuid",
  "action": "logout_success",
  "action_category": "authentication",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "request_method": "POST",
  "request_path": "/api/admin/logout",
  "metadata": {
    "email": "admin@circletel.co.za",
    "role": "super_admin",
    "role_template_id": "super_admin",
    "full_name": "Admin User"
  },
  "status": "success",
  "severity": "low",
  "is_suspicious": false,
  "created_at": "2025-10-31T12:05:00Z"
}
```

---

## 🔍 Monitoring Login Activity

### View in Admin Dashboard

Navigate to `/admin/audit-logs` to view all authentication events:

1. **Filter by Category**: Select "Authentication" from category filter
2. **Search**: Enter email address to see specific user's login history
3. **Suspicious Activity**: Red-highlighted rows indicate potential security threats

### Common Queries

**Recent Failed Logins**:
```sql
SELECT * FROM v_admin_audit_logs_recent
WHERE action_category = 'authentication'
  AND status = 'failure'
ORDER BY created_at DESC
LIMIT 50;
```

**Successful Logins Today**:
```sql
SELECT * FROM v_admin_audit_logs_recent
WHERE action = 'login_success'
  AND created_at > CURRENT_DATE
ORDER BY created_at DESC;
```

**Suspicious Login Attempts**:
```sql
SELECT * FROM v_admin_audit_logs_recent
WHERE action_category = 'authentication'
  AND is_suspicious = true
ORDER BY created_at DESC;
```

**User's Login History**:
```sql
SELECT * FROM v_admin_audit_logs_recent
WHERE user_email = 'admin@circletel.co.za'
  AND action IN ('login_success', 'login_failed', 'logout_success')
ORDER BY created_at DESC;
```

---

## 🚨 Suspicious Activity Detection

The audit logging system automatically detects suspicious login patterns:

### Trigger Conditions

**Multiple Failed Logins**:
- 3+ failed authentication attempts
- Within 15-minute window
- Same email address
- **Result**: `is_suspicious = true`, `severity = high`

**Multiple IP Addresses**:
- 3+ different IP addresses
- Within 5-minute window
- Same email address
- **Result**: `is_suspicious = true`, `severity = medium`

### Automated Actions

When suspicious activity is detected:
1. **Automatic Flagging**: `is_suspicious` set to `true`
2. **Severity Escalation**: Severity increased to `high` or `medium`
3. **Visual Alert**: Red background in audit logs UI
4. **Alert Badge**: "Suspicious" badge displayed on entry

---

## 🛡️ Security Best Practices

### For Development

1. **Test Credentials**:
   - Only exist in development database
   - Never use in production
   - Change before deploying

2. **IP Tracking**:
   - Test with different IPs to verify detection
   - Verify x-forwarded-for header is captured

3. **User Agent Tracking**:
   - Verify different clients are logged correctly
   - Test with browser, mobile, API clients

### For Production

1. **Monitor Failed Logins**:
   - Set up alerts for 5+ failed attempts in 1 hour
   - Review suspicious activity daily
   - Investigate high-severity events immediately

2. **Review Access Patterns**:
   - Check login times for unusual hours
   - Verify IP addresses match expected locations
   - Look for rapid login/logout cycles

3. **Disable Compromised Accounts**:
   - Set `is_active = false` in `admin_users` table
   - User will be denied access immediately
   - Attempt will be logged as `login_failed_inactive_account`

---

## 📈 Metrics and Analytics

### Key Performance Indicators (KPIs)

**Login Success Rate**:
```sql
SELECT
  COUNT(CASE WHEN action = 'login_success' THEN 1 END) as successful,
  COUNT(CASE WHEN action LIKE 'login_failed%' THEN 1 END) as failed,
  ROUND(
    COUNT(CASE WHEN action = 'login_success' THEN 1 END)::NUMERIC /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as success_rate_percent
FROM admin_audit_logs
WHERE action_category = 'authentication'
  AND created_at > NOW() - INTERVAL '7 days';
```

**Average Session Duration**:
```sql
WITH sessions AS (
  SELECT
    user_email,
    MIN(CASE WHEN action = 'login_success' THEN created_at END) as login_time,
    MIN(CASE WHEN action = 'logout_success' THEN created_at END) as logout_time
  FROM admin_audit_logs
  WHERE action IN ('login_success', 'logout_success')
  GROUP BY user_email, DATE(created_at)
)
SELECT
  AVG(EXTRACT(EPOCH FROM (logout_time - login_time)) / 60) as avg_session_minutes
FROM sessions
WHERE logout_time IS NOT NULL AND login_time IS NOT NULL;
```

**Most Active Users**:
```sql
SELECT
  user_email,
  full_name,
  COUNT(*) as login_count
FROM v_admin_audit_logs_recent
WHERE action = 'login_success'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY user_email, full_name
ORDER BY login_count DESC
LIMIT 10;
```

---

## 🔧 Troubleshooting

### Issue: Login Not Being Logged

**Symptoms**: No audit log entries for login attempts

**Possible Causes**:
1. API route not being called
2. Database migration not applied
3. Service role key not configured

**Solution**:
```bash
# 1. Verify migration
node scripts/apply-audit-logs-migration.js

# 2. Test API endpoint
node scripts/test-admin-login-audit.js

# 3. Check environment variables
grep SUPABASE_SERVICE_ROLE_KEY .env.local
```

### Issue: IP Address Shows as "unknown"

**Symptoms**: All audit logs have `ip_address: "unknown"`

**Possible Causes**:
1. Running on localhost without proxy
2. Headers not being forwarded
3. Reverse proxy misconfigured

**Solution**:
- In development: This is normal (localhost)
- In production: Configure reverse proxy to forward headers
  - Vercel: Automatic (uses `x-forwarded-for`)
  - Nginx: Add `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`

### Issue: Suspicious Activity Not Detecting

**Symptoms**: Multiple failed logins but `is_suspicious` remains `false`

**Possible Causes**:
1. Trigger function not created
2. Time window too short
3. Different email addresses used

**Solution**:
```sql
-- Verify trigger exists
SELECT tgname, tgrelid::regclass
FROM pg_trigger
WHERE tgname = 'detect_suspicious_activity_trigger';

-- Manually test detection
SELECT detect_suspicious_activity();
```

---

## 🚀 Future Enhancements

### Short Term
- [ ] Email notifications for suspicious activity
- [ ] Rate limiting on failed login attempts (prevent brute force)
- [ ] Two-factor authentication (2FA) support
- [ ] Login location tracking with geolocation

### Medium Term
- [ ] Session management dashboard
- [ ] Force logout all sessions
- [ ] Device fingerprinting
- [ ] Anomaly detection with ML

### Long Term
- [ ] Real-time security alerts
- [ ] Automated account lockout after threshold
- [ ] Compliance reporting (POPIA, GDPR)
- [ ] Security dashboard with threat intelligence

---

## 📚 Related Documentation

- **Main Audit System**: `docs/admin/ADMIN_AUTH_AND_AUDIT_SYSTEM.md`
- **RBAC System**: `docs/rbac/RBAC_SYSTEM_GUIDE.md`
- **Password Reset**: See main audit system documentation
- **Supabase Schema**: `supabase/migrations/20251031000003_create_admin_audit_logs.sql`

---

**Last Updated**: October 31, 2025
**Author**: CircleTel Development Team
**Version**: 1.0
**Status**: ✅ Production Ready
