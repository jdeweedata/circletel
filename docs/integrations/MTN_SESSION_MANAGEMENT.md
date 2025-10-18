# MTN SSO Session Management Guide

## 📖 Overview

This document explains how to keep MTN SSO sessions alive in production to ensure uninterrupted access to MTN Wholesale APIs.

## 🏢 MTN Product Mapping

### CircleTel Product Portfolio Integration

MTN wholesale products map to CircleTel's product offerings as follows:

| MTN Product | CircleTel Portfolio | Use Case |
|-------------|-------------------|----------|
| **Fixed Wireless Broadband** | **SkyFibre** | Coverage feasibility checks for Fixed Wireless/LTE solutions |
| Wholesale FTTH FNO | Fibre Packages | Fibre-to-the-Home installations |
| Wholesale FTTH (MNS) | Fibre Packages | Multi-Node FTTH solutions |
| Wholesale Cloud Connect | Enterprise Cloud | Cloud connectivity services |
| Wholesale Access Connect | Business Connectivity | Enterprise access solutions |
| Wholesale Cloud Connect Lite | SME Cloud | Small-medium enterprise cloud |
| Wholesale Ethernet Wave Leased Line | Enterprise Connectivity | Dedicated leased lines |

**Important**: When performing coverage feasibility checks via `/api/mtn-wholesale/feasibility`:
- Use `product_names: ["Fixed Wireless Broadband"]` for SkyFibre coverage checks
- Results indicate 5G/LTE availability for CircleTel's Fixed Wireless offerings
- This is the primary integration point for the coverage checker on the CircleTel website

### Example Feasibility Request for SkyFibre

**NEW: Automatic Geocoding** - You no longer need to provide coordinates! The API will automatically geocode addresses using Google Maps.

```bash
# Simple request - address only (RECOMMENDED)
curl -X POST https://your-domain.vercel.app/api/mtn-wholesale/feasibility \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": [
      {
        "address": "18 Rasmus Erasmus, Heritage Hill, Centurion",
        "customer_name": "Test Customer"
      }
    ],
    "product_names": ["Fixed Wireless Broadband"],
    "requestor": "coverage@circletel.co.za"
  }'

# Advanced request - with manual coordinates (optional)
curl -X POST https://your-domain.vercel.app/api/mtn-wholesale/feasibility \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": [
      {
        "address": "123 Main Street, Johannesburg, 2000",
        "customer_name": "John Doe",
        "latitude": "-26.2041",
        "longitude": "28.0473"
      }
    ],
    "product_names": ["Fixed Wireless Broadband"],
    "requestor": "coverage@circletel.co.za"
  }'
```

**How it works:**
1. If you provide `latitude` and `longitude`, they will be validated and used if within South Africa
2. If coordinates are missing or invalid, the address is automatically geocoded using Google Maps
3. Google's accurate coordinates ensure reliable coverage results
4. Response includes the geocoded coordinates used for the check

**Response indicates SkyFibre availability at the specified location.**

## ⏱️ Session Lifecycle

- **Duration**: ~60 minutes
- **Expiration Buffer**: 5 minutes (session considered invalid 5 minutes before actual expiry)
- **Effective Lifetime**: ~55 minutes
- **Recommended Refresh Interval**: Every 50 minutes

## 🔄 Automated Refresh Strategies

### Strategy 1: GitHub Actions (Recommended) ⭐

**Pros:**
- ✅ Fully automated
- ✅ No infrastructure cost
- ✅ Built-in scheduling
- ✅ Auto-updates Vercel environment variables
- ✅ Triggers automatic redeployment

**Cons:**
- ⚠️ Requires GitHub repository
- ⚠️ Requires Vercel API access
- ⚠️ GitHub Actions minutes count toward quota (but minimal usage)

**Setup Steps:**

1. **Create GitHub Secrets:**
   ```
   MTN_USERNAME = Lindokuhle.mdake@circletel.co.za
   MTN_PASSWORD = Lwandle@1992*
   VERCEL_TOKEN = <create-at-vercel.com/account/tokens>
   VERCEL_PROJECT_ID = <from-vercel-link-command>
   VERCEL_ORG_ID = <from-vercel-link-command>
   ```

2. **Get Vercel Credentials:**
   ```bash
   # Get Vercel token
   # Visit: https://vercel.com/account/tokens
   # Click "Create Token" → Copy

   # Get Project/Org IDs
   cd circletel-nextjs
   vercel link
   cat .vercel/project.json
   ```

3. **Workflow File:** `.github/workflows/refresh-mtn-session.yml` (already created)

4. **Monitor:**
   - GitHub Actions tab: `https://github.com/YOUR_ORG/circletel-nextjs/actions`
   - Runs every 50 minutes automatically
   - Email notifications on failure

**How It Works:**

```
Every 50 minutes:
1. GitHub Actions runner starts
2. Installs dependencies + Playwright
3. Runs: npx tsx scripts/test-mtn-sso-auth.ts --headless
4. Exports session to base64
5. Updates MTN_SESSION in Vercel via API
6. Triggers Vercel redeployment
7. New session is live in production
```

---

### Strategy 2: Vercel Cron Jobs

**Pros:**
- ✅ Native Vercel integration
- ✅ No external dependencies

**Cons:**
- ❌ **Cannot run Playwright in serverless** (Vercel functions are stateless)
- ❌ Cannot refresh session automatically
- ⚠️ Can only monitor session status

**Use Case:** Health checks and monitoring only

**Implementation:**

```typescript
// vercel.json
{
  "crons": [
    {
      "path": "/api/mtn-wholesale/refresh",
      "schedule": "*/50 * * * *"
    }
  ]
}
```

**Endpoint:** `/api/mtn-wholesale/refresh` (already created)

**Behavior:**
- Checks if session is expiring soon
- Returns warning if < 10 minutes left
- **Cannot refresh** (requires manual intervention)
- Can trigger alerts to external monitoring

---

### Strategy 3: External Monitoring Service

**Pros:**
- ✅ Independent of your infrastructure
- ✅ Uptime monitoring + session monitoring
- ✅ Multi-region checks
- ✅ Alert notifications

**Cons:**
- ⚠️ Requires third-party service (most have free tiers)
- ❌ Cannot refresh session (monitoring only)

**Recommended Services:**
- **UptimeRobot** (free tier: 50 monitors, 5-min intervals)
- **Better Uptime** (free tier: 10 monitors, 3-min intervals)
- **Pingdom** (paid)

**Setup:**

1. **Create Monitor:**
   - URL: `https://your-domain.vercel.app/api/mtn-wholesale/refresh`
   - Method: GET
   - Interval: 5 minutes
   - Expected: 200 status code

2. **Configure Alerts:**
   - Trigger: When `needsRefresh: true` in response
   - Action: Email/SMS notification
   - You manually refresh session when alerted

3. **Response Format:**
   ```json
   {
     "valid": true,
     "expiresAt": "2025-10-17T10:22:45.804Z",
     "minutesLeft": 45,
     "needsRefresh": false
   }
   ```

---

### Strategy 4: Manual Refresh (Fallback)

**When to Use:**
- Initial setup/testing
- Automated systems fail
- Temporary solution before automation setup

**Process:**

```bash
# 1. Authenticate locally
npx tsx scripts/test-mtn-sso-auth.ts --manual

# 2. Export session
npx tsx scripts/export-session-env.ts

# 3. Copy base64 output

# 4. Update Vercel
# Go to: https://vercel.com/YOUR_ORG/circletel/settings/environment-variables
# Update MTN_SESSION value

# 5. Redeploy (optional - takes effect on next deployment)
vercel --prod
```

**Frequency:** Every ~50 minutes (set a reminder!)

---

## 🏗️ Architecture

### Local Development

```
┌─────────────────────────┐
│ Playwright Browser      │
│ ├─ Login to MTN SSO     │
│ ├─ Solve reCAPTCHA      │
│ ├─ Extract Cookies      │
│ └─ Cache to File        │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ .cache/mtn-session.json │
│ ├─ cookies[]            │
│ ├─ sessionId            │
│ └─ expiresAt            │
└─────────────────────────┘
```

### Production (Vercel)

```
┌─────────────────────────┐
│ Vercel Environment Vars │
│ MTN_SESSION (base64)    │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ MTN SSO Auth Service    │
│ ├─ Decode base64        │
│ ├─ Parse JSON           │
│ ├─ Validate expiry      │
│ └─ Generate Cookie Hdr  │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ MTN Wholesale APIs      │
│ ├─ Products API         │
│ └─ Feasibility API      │
└─────────────────────────┘
```

### GitHub Actions Workflow

```
┌─────────────────────────┐
│ Cron Schedule           │
│ (every 50 minutes)      │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ GitHub Actions Runner   │
│ 1. Checkout code        │
│ 2. Install deps         │
│ 3. Install Playwright   │
│ 4. Authenticate         │
│ 5. Export session       │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Vercel API              │
│ PATCH /v10/projects/    │
│   $PROJECT_ID/env/      │
│   MTN_SESSION           │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Trigger Redeployment    │
│ POST /v13/deployments   │
└─────────────────────────┘
```

---

## 🔐 Security Considerations

### Session Storage

**Local Development:**
- ✅ Stored in `.cache/mtn-session.json`
- ✅ Excluded from git (`.gitignore`)
- ✅ File permissions: User-only read/write

**Production (Vercel):**
- ✅ Stored as environment variable
- ✅ Base64 encoded (obfuscation, not encryption)
- ✅ Encrypted at rest by Vercel
- ✅ Only accessible by deployment runtime

**GitHub Secrets:**
- ✅ Encrypted by GitHub
- ✅ Never exposed in logs
- ✅ Only accessible by workflows

### Credentials

**MTN Username/Password:**
- ❌ Never commit to repository
- ✅ Store in environment variables (local: `.env.local`)
- ✅ Store in Vercel environment variables
- ✅ Store in GitHub Secrets (for Actions)

**Vercel API Token:**
- ❌ Never commit to repository
- ✅ Store only in GitHub Secrets
- ⚠️ Use token with minimal required permissions
- ✅ Rotate regularly (every 90 days)

**CRON_SECRET:**
- ✅ Random string (min 32 characters)
- ✅ Required for `/api/mtn-wholesale/refresh` endpoint
- ✅ Prevents unauthorized session refresh attempts

---

## 🛠️ Troubleshooting

### GitHub Actions Failing

**Error: "Authentication failed"**
- Check MTN_USERNAME and MTN_PASSWORD secrets
- Verify MTN SSO portal is accessible
- Check if reCAPTCHA blocking (may need manual mode)

**Error: "Failed to update Vercel env vars"**
- Verify VERCEL_TOKEN is valid
- Check token has correct permissions
- Verify VERCEL_PROJECT_ID and VERCEL_ORG_ID are correct

**Solution:**
```bash
# Get new Vercel token
# Visit: https://vercel.com/account/tokens

# Get project IDs
vercel link
cat .vercel/project.json

# Update GitHub secrets
```

### Session Expiring Too Quickly

**Symptom:** APIs return 401/403 before 1 hour

**Causes:**
1. MTN changed session duration
2. IP address changed (invalidates session)
3. Multiple concurrent authentications

**Solution:**
- Reduce refresh interval to 30 minutes
- Monitor session `expiresAt` timestamps
- Check GitHub Actions logs for pattern

### Vercel Deployment Not Picking Up New Session

**Symptom:** Environment variable updated but still using old session

**Cause:** Vercel caches environment variables until redeployment

**Solution:**
```bash
# Option 1: Trigger redeployment (GitHub Actions does this automatically)
vercel --prod

# Option 2: Wait for next commit/push (triggers auto-deploy)
git commit --allow-empty -m "Trigger redeploy"
git push
```

---

## 📊 Monitoring

### Key Metrics to Track

1. **Session Age:**
   - Current time vs `expiresAt`
   - Alert if < 10 minutes remaining

2. **Refresh Success Rate:**
   - Track GitHub Actions workflow success/failure
   - Alert on 2+ consecutive failures

3. **API Error Rate:**
   - Monitor 401/403 responses
   - Correlate with session age

4. **Refresh Frequency:**
   - Should be ~every 50 minutes
   - Alert if gap > 60 minutes

### Monitoring Dashboard

**GitHub Actions:**
```
https://github.com/YOUR_ORG/circletel-nextjs/actions/workflows/refresh-mtn-session.yml
```

**Vercel Deployments:**
```
https://vercel.com/YOUR_ORG/circletel/deployments
```

**API Health:**
```bash
# Check session status
curl https://your-domain.vercel.app/api/mtn-wholesale/refresh

# Response:
{
  "valid": true,
  "expiresAt": "2025-10-17T11:15:00.000Z",
  "minutesLeft": 42,
  "needsRefresh": false
}
```

---

## 🚀 Quick Start Checklist

### Initial Setup

- [ ] Run manual authentication: `npx tsx scripts/test-mtn-sso-auth.ts --manual`
- [ ] Export session: `npx tsx scripts/export-session-env.ts`
- [ ] Add MTN_SESSION to Vercel (Production + Staging)
- [ ] Deploy to Vercel: `vercel --prod`
- [ ] Verify APIs work: `curl https://your-domain.vercel.app/api/mtn-wholesale/products`

### Automated Refresh Setup (GitHub Actions)

- [ ] Get Vercel token: https://vercel.com/account/tokens
- [ ] Get Project/Org IDs: `vercel link && cat .vercel/project.json`
- [ ] Add GitHub Secrets: MTN_USERNAME, MTN_PASSWORD, VERCEL_TOKEN, VERCEL_PROJECT_ID, VERCEL_ORG_ID
- [ ] Commit workflow file: `.github/workflows/refresh-mtn-session.yml`
- [ ] Push to GitHub
- [ ] Verify first run: https://github.com/YOUR_ORG/circletel-nextjs/actions
- [ ] Set up failure notifications (GitHub Settings → Notifications)

### Monitoring Setup

- [ ] Create UptimeRobot monitor: `https://your-domain.vercel.app/api/mtn-wholesale/refresh`
- [ ] Configure alert: Email/SMS when `needsRefresh: true`
- [ ] Test alert by manually expiring session
- [ ] Document on-call procedure for session refresh failures

---

## 📚 Related Documentation

- **Deployment Guide**: `DEPLOYMENT_QUICKSTART.md`
- **API Reference**: `docs/integrations/MTN_SSO_IMPLEMENTATION_SUMMARY.md`
- **Testing Guide**: `docs/testing/MTN_SSO_SUCCESS_REPORT.md`
- **Troubleshooting**: `docs/deployment/VERCEL_MTN_SSO_DEPLOYMENT.md`

---

**Last Updated**: 2025-10-17
**Version**: 1.0
**Author**: CircleTel Development Team
