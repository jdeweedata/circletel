# Integration Management - Manual Testing Guide

## 🎯 Quick Start

**What You Can Test Right Now**:
1. ✅ Database schema & data (already verified - 100% passing)
2. ✅ API endpoints (requires dev server running)
3. ✅ Health check service

---

## 📋 Test Checklist

### Prerequisites
- [ ] Development server is running: `npm run dev:memory`
- [ ] You're logged in as admin user in browser
- [ ] You have admin session cookie from browser DevTools

---

## 🧪 Test 1: Database Verification (Already Passing ✅)

Run the database tests:

```bash
node scripts/test-database-only.js
```

**Expected Output**:
```
✅ integration_registry table accessible
✅ Integrations seeded (expect 9) - Found: 9
✅ integration_oauth_tokens table accessible
✅ Zoho OAuth tokens exist (expect 3) - Found: 3
... (9/9 tests passing)
```

---

## 🧪 Test 2: API Endpoints (Manual Testing)

### Option A: Using Browser (Easiest)

1. **Start dev server**:
   ```bash
   npm run dev:memory
   ```

2. **Login as admin** at http://localhost:3000/admin

3. **Open browser console** (F12) and run:

```javascript
// Test 1: List all integrations
fetch('/api/admin/integrations')
  .then(r => r.json())
  .then(data => console.log('Integrations:', data));

// Test 2: Get Zoho CRM details
fetch('/api/admin/integrations/zoho-crm')
  .then(r => r.json())
  .then(data => console.log('Zoho CRM:', data));

// Test 3: Trigger health check for Zoho CRM
fetch('/api/admin/integrations/zoho-crm/health', { method: 'POST' })
  .then(r => r.json())
  .then(data => console.log('Health Check:', data));

// Test 4: List OAuth tokens
fetch('/api/admin/integrations/oauth/tokens')
  .then(r => r.json())
  .then(data => console.log('OAuth Tokens:', data));
```

### Option B: Using curl (Advanced)

**Get admin session cookie**:
1. Login at http://localhost:3000/admin
2. Open DevTools → Application → Cookies
3. Copy the session cookie value

```bash
# Set your session cookie
SESSION_COOKIE="your-session-cookie-here"

# Test 1: List integrations
curl -X GET http://localhost:3000/api/admin/integrations \
  -H "Cookie: $SESSION_COOKIE"

# Test 2: Get Zoho CRM details
curl -X GET http://localhost:3000/api/admin/integrations/zoho-crm \
  -H "Cookie: $SESSION_COOKIE"

# Test 3: Health check
curl -X POST http://localhost:3000/api/admin/integrations/zoho-crm/health \
  -H "Cookie: $SESSION_COOKIE"

# Test 4: List OAuth tokens
curl -X GET http://localhost:3000/api/admin/integrations/oauth/tokens \
  -H "Cookie: $SESSION_COOKIE"

# Test 5: Refresh OAuth token (will actually refresh Zoho token)
curl -X POST http://localhost:3000/api/admin/integrations/oauth/zoho-crm/refresh \
  -H "Cookie: $SESSION_COOKIE"
```

---

## ✅ Expected Results

### Test 1: List All Integrations

```json
{
  "integrations": [
    {
      "id": "...",
      "slug": "clickatell",
      "name": "Clickatell SMS",
      "integration_type": "api_key",
      "health_status": "unknown",
      "is_active": true
    },
    // ... 8 more integrations
  ],
  "summary": {
    "healthy": 0,
    "degraded": 0,
    "down": 0,
    "unknown": 9
  }
}
```

### Test 2: Get Integration Details (Zoho CRM)

```json
{
  "integration": {
    "slug": "zoho-crm",
    "name": "Zoho CRM",
    "integration_type": "oauth",
    "health_status": "unknown",
    "base_url": "https://www.zohoapis.com",
    "is_active": true
  },
  "oauthTokens": {
    "hasAccessToken": true,
    "hasRefreshToken": true,
    "expiresAt": null,
    "lastRefreshedAt": null,
    "refreshCount": 0,
    "scopes": ["ZohoCRM.modules.ALL", "ZohoCRM.settings.ALL", "ZohoCRM.users.READ", "ZohoCRM.org.READ"]
  },
  "webhooks": [],
  "recentMetrics": {
    "avgResponseTime": 0,
    "errorRate": 0,
    "uptime": 1
  },
  "cronJobs": [],
  "activityLogs": []
}
```

### Test 3: Health Check

```json
{
  "success": true,
  "result": {
    "integrationSlug": "zoho-crm",
    "integrationName": "Zoho CRM",
    "healthStatus": "healthy",
    "responseTime": 234,
    "lastChecked": "2025-11-16T20:00:00.000Z",
    "checks": {
      "oauth": {
        "valid": true,
        "expiresIn": 999999
      }
    },
    "issues": []
  }
}
```

### Test 4: List OAuth Tokens

```json
{
  "tokens": [
    {
      "integrationSlug": "zoho-billing",
      "integrationName": "Zoho Billing",
      "hasAccessToken": true,
      "hasRefreshToken": true,
      "expiresAt": null,
      "expiresIn": 0,
      "lastRefreshedAt": null,
      "refreshCount": 0,
      "scopes": ["ZohoSubscriptions.subscriptions.ALL", ...],
      "status": "valid"
    },
    // zoho-crm, zoho-sign
  ],
  "summary": {
    "total": 3,
    "valid": 3,
    "expiringSoon": 0,
    "expired": 0,
    "error": 0
  }
}
```

### Test 5: Refresh OAuth Token

```json
{
  "success": true,
  "expiresAt": "2025-11-16T21:00:00.000Z",
  "message": "OAuth token refreshed successfully"
}
```

---

## 🐛 Troubleshooting

### Error: 401 Unauthorized
- **Cause**: Not logged in as admin or session expired
- **Fix**: Login at http://localhost:3000/admin and get new session cookie

### Error: 403 Forbidden
- **Cause**: User is not an admin or admin is inactive
- **Fix**: Verify user exists in `admin_users` table with `is_active = true`

### Error: 500 Internal Server Error
- **Cause**: Server error (check console logs)
- **Fix**: Check terminal for error details, likely OAuth token or database issue

### OAuth Refresh Fails
- **Cause**: Invalid refresh token or Zoho API issue
- **Fix**: Regenerate OAuth token using `scripts/generate-zoho-auth-url.js`

---

## 📊 What to Verify

### Database Checks ✅
- [x] 7 tables created
- [x] 9 integrations registered
- [x] 3 Zoho OAuth tokens inserted
- [x] All tokens have valid client_id and scopes

### API Route Checks
- [ ] List integrations returns 9 items
- [ ] Integration details include OAuth tokens (for Zoho integrations)
- [ ] Health check updates `health_status` in database
- [ ] OAuth token list shows 3 Zoho tokens with correct scopes
- [ ] OAuth refresh successfully updates `expires_at` and `refresh_count`
- [ ] Activity logs are created for admin actions

### Health Check Service
- [ ] OAuth check validates token expiry
- [ ] API check can ping external services (may fail for some due to auth requirements)
- [ ] Webhook check calculates failure rate (currently 0/0)
- [ ] Health status correctly determined (healthy/degraded/down)

---

## 🎯 Success Criteria

**Phase 1 Testing Complete When**:
- ✅ All database tests pass (9/9)
- ⏳ All 5 API endpoint tests return expected responses
- ⏳ Health check service runs without errors
- ⏳ OAuth refresh successfully updates database
- ⏳ Activity logs are created for each admin action

---

## 📝 Test Results Log

**Date**: 2025-11-16

| Test | Status | Notes |
|------|--------|-------|
| Database schema | ✅ PASS | 9/9 tests passing |
| Integration list API | ⏳ Pending | Requires dev server |
| Integration detail API | ⏳ Pending | Requires dev server |
| Health check API | ⏳ Pending | Requires dev server |
| OAuth tokens API | ⏳ Pending | Requires dev server |
| OAuth refresh API | ⏳ Pending | Requires dev server |

**Next Steps**:
1. Start dev server: `npm run dev:memory`
2. Test API endpoints in browser console
3. Document any issues found
4. Proceed with remaining implementation (webhooks, cron, frontend)

---

## 🚀 Ready to Continue?

After testing:
1. **All tests pass**: Continue with Phase 2 (webhook/API/cron routes)
2. **Some tests fail**: Fix issues before proceeding
3. **Need help**: Share test results for debugging

