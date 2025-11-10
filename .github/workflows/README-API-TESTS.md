# API Integration Tests - CI/CD Setup

This guide explains how to configure and use the automated API integration tests in the GitHub Actions CI/CD pipeline.

## Overview

The `api-integration-tests.yml` workflow automatically tests the admin quote APIs whenever code changes are pushed or a PR is created.

### What It Tests

- ✅ Admin authentication (login, session cookies)
- ✅ Admin authorization (RBAC permissions)
- ✅ Quote CRUD operations (Create, Read, Update, Delete)
- ✅ Analytics endpoints
- ✅ Pending quotes management
- ✅ Security validation (no hardcoded credentials)
- ✅ TypeScript type checking

### When It Runs

**Automatically triggers on**:
- Pull requests to `main` or `staging`
- Pushes to `main`, `staging`, or `feature/*` branches
- Changes to:
  - `app/api/quotes/**`
  - `app/api/admin/**`
  - `lib/auth/**`
  - `lib/supabase/**`
  - Test scripts

**Manual trigger**:
- Go to Actions → API Integration Tests → Run workflow

---

## 🔐 Required Secrets

Before the tests can run, you need to configure these secrets in your GitHub repository:

### Step 1: Navigate to Secrets

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### Step 2: Add Required Secrets

| Secret Name | Description | Example/Source |
|-------------|-------------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `ADMIN_TEST_EMAIL` | Test admin user email | `test@circletel.co.za` |
| `ADMIN_TEST_PASSWORD` | Test admin user password | `SecurePassword123!` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | (Optional) Google Maps key | `AIzaSy...` |

### Step 3: Create Test Admin User

If you don't have a test admin user, create one:

```bash
# On your local machine or test database
node scripts/create-super-admin.js
```

**Important**:
- Use a **dedicated test database** for CI/CD (not production!)
- Create a test admin user specifically for automated testing
- Store test credentials securely in GitHub Secrets

---

## 🚀 Quick Setup Script

Run this to verify your secrets are configured correctly:

```bash
# Test locally first
npm run dev:memory &
sleep 30  # Wait for server

# Run the authenticated tests
ADMIN_TEST_EMAIL="your-test-admin@circletel.co.za" \
ADMIN_TEST_PASSWORD="your-test-password" \
node scripts/test-admin-quote-apis-authenticated.js

# If successful, you're ready for CI/CD!
```

---

## 📊 Understanding Test Results

### In GitHub Actions

1. Go to **Actions** tab
2. Click on the latest workflow run
3. View the **Test Report** in the summary

### Test Stages

The workflow runs 5 jobs in sequence:

```
1. Prepare Test DB
   └─ Verifies admin user and test data exist

2. API Tests (Node 18.x & 20.x)
   └─ Runs authenticated API test suite

3. Type Check
   └─ Validates TypeScript in auth files

4. Security Check
   └─ Scans for hardcoded credentials

5. Report
   └─ Generates summary and comments on PR
```

### Reading Results

**✅ Green (Success)**:
- All tests passed
- Safe to merge

**⚠️ Yellow (Warning)**:
- Tests passed but with warnings
- Type errors present (pre-existing)
- Review before merging

**❌ Red (Failure)**:
- Critical tests failed
- Authentication/authorization broken
- DO NOT MERGE - fix issues first

---

## 🐛 Troubleshooting

### "Admin user not found"

**Cause**: Test admin user doesn't exist in the test database

**Fix**:
```bash
# Create test admin user
node scripts/create-super-admin.js

# Or run the checker
node scripts/check-admin-user.js
```

### "No packages found"

**Cause**: Test database has no service packages

**Fix**:
```bash
# Seed test packages
npm run seed:packages  # Or your seed command

# Or insert manually
psql $DATABASE_URL -c "INSERT INTO service_packages (...) VALUES (...);"
```

### "Server failed to start"

**Cause**: Missing environment variables or port conflict

**Fix**:
- Check all secrets are configured in GitHub
- Verify Supabase keys are valid
- Check for port conflicts (use 3001 if needed)

### "Tests timing out"

**Cause**: Server startup slow or database connection issues

**Fix**:
- Increase wait time in workflow (currently 30s)
- Check Supabase connection limits
- Verify network connectivity

---

## 📈 Performance Benchmarks

Expected test durations:

| Stage | Duration | Acceptable Range |
|-------|----------|------------------|
| Prepare DB | 10-20s | < 30s |
| Server Start | 20-30s | < 60s |
| API Tests | 30-60s | < 120s |
| Type Check | 20-40s | < 60s |
| Security | 5-10s | < 20s |
| **Total** | **2-4 min** | **< 6 min** |

If tests take longer than 6 minutes, investigate:
- Database query performance
- Network latency to Supabase
- Server memory constraints

---

## 🔄 Workflow Customization

### Run Tests on Different Branches

Edit `.github/workflows/api-integration-tests.yml`:

```yaml
on:
  push:
    branches:
      - main
      - staging
      - develop  # Add custom branch
      - 'feature/**'
```

### Change Node Versions

Modify the matrix strategy:

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x, 22.x]  # Add/remove versions
```

### Adjust Server Wait Time

Increase if server takes longer to start:

```yaml
- name: Start test server
  run: |
    npm run dev:memory &
    sleep 60  # Increase from 30s to 60s
```

### Skip Tests on Non-Critical Changes

Add paths to exclude:

```yaml
on:
  push:
    paths-ignore:
      - 'docs/**'
      - '**.md'
      - '.github/**'
```

---

## 🎯 Best Practices

### 1. Use Test Database

**Never** run CI/CD tests against production database:

```yaml
# ✅ GOOD: Separate test database
NEXT_PUBLIC_SUPABASE_URL: https://test-project.supabase.co

# ❌ BAD: Production database
NEXT_PUBLIC_SUPABASE_URL: https://prod-project.supabase.co
```

### 2. Rotate Test Credentials

Change test admin password regularly:

```bash
# Every 90 days
1. Create new test admin user
2. Update GitHub secret: ADMIN_TEST_PASSWORD
3. Delete old test user
```

### 3. Monitor Test Failures

Set up notifications:

1. GitHub → Settings → Notifications
2. Enable "Actions" notifications
3. Get alerts on test failures

### 4. Keep Tests Fast

- Use indexed database queries
- Mock external API calls
- Limit test data size
- Run in parallel when possible

### 5. Review Test Coverage

Regularly check:
- Are all critical endpoints tested?
- Are edge cases covered?
- Are error scenarios tested?

---

## 📚 Related Documentation

- [Admin Quote API Test Results](../../docs/testing/ADMIN_QUOTE_API_TEST_RESULTS_2025-11-10.md)
- [Authentication System](../../docs/architecture/AUTHENTICATION_SYSTEM.md)
- [Admin API Auth Implementation](../../docs/implementation/ADMIN_QUOTE_AUTH_COMPLETE.md)
- [Quick API Reference](../../docs/testing/QUICK_API_REFERENCE.md)

---

## 🆘 Getting Help

**Tests failing?**
1. Check the job logs for detailed error messages
2. Run tests locally first: `node scripts/test-admin-quote-apis-authenticated.js`
3. Review recent changes to auth/quote code
4. Check Supabase status: https://status.supabase.com

**Need to add more tests?**
1. Update `scripts/test-admin-quote-apis-authenticated.js`
2. Add new test functions
3. Ensure proper error handling
4. Test locally before pushing

**Security concerns?**
1. Never commit secrets to the repository
2. Use GitHub Secrets for all sensitive data
3. Rotate credentials regularly
4. Review security check failures immediately

---

**Last Updated**: 2025-11-10
**Maintained By**: Development Team
**Status**: ✅ Active
