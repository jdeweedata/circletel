# MTN SSO Authentication - Vercel Deployment Guide

**Environments**:
- **Production**: https://vercel.com/jdewee-livecoms-projects/circletel
- **Staging**: https://vercel.com/jdewee-livecoms-projects/circletel-stagging

**Challenge**: Vercel serverless functions are stateless - file-based session caching won't work across deployments.

---

## 🎯 Deployment Strategy

### Problem: Serverless Limitations

Vercel's serverless architecture means:
- ❌ No persistent file system (`.cache/` files lost between invocations)
- ❌ No shared memory across function instances
- ❌ Playwright browsers need special configuration

### Solution: Multiple Approaches

We'll implement **3-tier fallback strategy**:

1. **Primary**: Vercel KV (Redis) for session storage
2. **Fallback**: Environment variable session injection
3. **Emergency**: Headless Playwright with reCAPTCHA solver

---

## 📋 Implementation Options

### Option 1: Vercel KV (Redis) - RECOMMENDED ⭐

**Pros**:
- ✅ Persistent session storage across deployments
- ✅ Fast (sub-millisecond retrieval)
- ✅ Automatic expiration handling
- ✅ Works in both production and staging

**Implementation**:

#### Step 1: Install Vercel KV
```bash
# Install Vercel KV SDK
npm install @vercel/kv

# Link project to Vercel KV
vercel env pull
```

#### Step 2: Update MTN SSO Service

Create `lib/services/mtn-sso-auth-vercel.ts`:

```typescript
import { kv } from '@vercel/kv';
import { chromium } from 'playwright';
import type { Cookie } from 'playwright';

interface AuthSession {
  cookies: Cookie[];
  expiresAt: string;
  sessionId: string;
}

const KV_KEY = 'mtn-sso-session';

export class MTNSSOAuthVercel {
  private static instance: MTNSSOAuthVercel;

  private constructor() {}

  public static getInstance(): MTNSSOAuthVercel {
    if (!MTNSSOAuthVercel.instance) {
      MTNSSOAuthVercel.instance = new MTNSSOAuthVercel();
    }
    return MTNSSOAuthVercel.instance;
  }

  /**
   * Get session from Vercel KV
   */
  async getAuthSession() {
    try {
      // Try to get from KV
      const session = await kv.get<AuthSession>(KV_KEY);

      if (session && this.isSessionValid(session)) {
        console.log('[MTN SSO KV] Using cached session from KV');
        return {
          success: true,
          cookies: session.cookies,
          sessionId: session.sessionId,
          expiresAt: new Date(session.expiresAt)
        };
      }

      // Session expired or doesn't exist
      console.log('[MTN SSO KV] No valid session, authentication required');

      // In production, we should have pre-cached session
      // Return error to trigger manual intervention
      return {
        success: false,
        error: 'No valid session in KV. Run pre-deployment authentication.'
      };
    } catch (error) {
      console.error('[MTN SSO KV] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'KV error'
      };
    }
  }

  /**
   * Save session to Vercel KV
   */
  async saveSession(session: AuthSession) {
    try {
      const ttl = Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000);

      await kv.set(KV_KEY, session, {
        ex: ttl // Expiration in seconds
      });

      console.log(`[MTN SSO KV] Session saved to KV, expires in ${ttl}s`);
      return true;
    } catch (error) {
      console.error('[MTN SSO KV] Save error:', error);
      return false;
    }
  }

  /**
   * Get cookie header
   */
  async getCookieHeader(): Promise<string | null> {
    const session = await this.getAuthSession();

    if (!session.success || !session.cookies) {
      return null;
    }

    return session.cookies
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ');
  }

  /**
   * Check if session is valid
   */
  private isSessionValid(session: AuthSession): boolean {
    const expiresAt = new Date(session.expiresAt);
    const now = new Date();
    const bufferMs = 5 * 60 * 1000; // 5 minutes

    return expiresAt.getTime() - now.getTime() > bufferMs;
  }

  /**
   * Clear session from KV
   */
  async clearSession() {
    await kv.del(KV_KEY);
    console.log('[MTN SSO KV] Session cleared from KV');
  }
}

export const mtnSSOAuthVercel = MTNSSOAuthVercel.getInstance();
```

#### Step 3: Create Pre-Deployment Script

Create `scripts/deploy-to-vercel.sh`:

```bash
#!/bin/bash

# MTN SSO Pre-Deployment Script for Vercel

set -e  # Exit on error

ENVIRONMENT=$1  # "production" or "staging"

if [ -z "$ENVIRONMENT" ]; then
  echo "Usage: ./scripts/deploy-to-vercel.sh [production|staging]"
  exit 1
fi

echo "=================================="
echo "MTN SSO Vercel Deployment"
echo "Environment: $ENVIRONMENT"
echo "=================================="
echo ""

# Step 1: Authenticate with MTN SSO
echo "Step 1: Authenticating with MTN SSO..."
npx tsx scripts/test-mtn-sso-auth.ts --manual

if [ ! -f ".cache/mtn-session.json" ]; then
  echo "❌ Authentication failed - no session file created"
  exit 1
fi

echo "✅ Authentication successful"
echo ""

# Step 2: Upload session to Vercel KV
echo "Step 2: Uploading session to Vercel KV..."
npx tsx scripts/upload-session-to-kv.ts --env=$ENVIRONMENT

if [ $? -ne 0 ]; then
  echo "❌ Failed to upload session to KV"
  exit 1
fi

echo "✅ Session uploaded to KV"
echo ""

# Step 3: Deploy to Vercel
echo "Step 3: Deploying to Vercel..."

if [ "$ENVIRONMENT" == "production" ]; then
  vercel --prod
else
  vercel
fi

echo ""
echo "=================================="
echo "✅ Deployment Complete!"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Verify deployment at Vercel dashboard"
echo "2. Test MTN APIs:"
echo "   curl https://your-domain.com/api/mtn-wholesale/products"
echo ""
```

#### Step 4: Create KV Upload Script

Create `scripts/upload-session-to-kv.ts`:

```typescript
import { kv } from '@vercel/kv';
import fs from 'fs/promises';
import path from 'path';

async function uploadSessionToKV() {
  try {
    const environment = process.argv.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'production';

    console.log(`Uploading session to Vercel KV (${environment})...`);

    // Read local session file
    const sessionPath = path.join(process.cwd(), '.cache', 'mtn-session.json');
    const sessionData = await fs.readFile(sessionPath, 'utf-8');
    const session = JSON.parse(sessionData);

    // Calculate TTL
    const expiresAt = new Date(session.expiresAt);
    const ttl = Math.floor((expiresAt.getTime() - Date.now()) / 1000);

    if (ttl <= 0) {
      throw new Error('Session already expired');
    }

    // Upload to KV
    await kv.set('mtn-sso-session', session, { ex: ttl });

    console.log('✅ Session uploaded to Vercel KV');
    console.log(`   Session ID: ${session.sessionId}`);
    console.log(`   Expires in: ${ttl} seconds (${Math.floor(ttl / 60)} minutes)`);
    console.log(`   Environment: ${environment}`);

  } catch (error) {
    console.error('❌ Failed to upload session:', error);
    process.exit(1);
  }
}

uploadSessionToKV();
```

Make script executable:
```bash
chmod +x scripts/deploy-to-vercel.sh
```

---

### Option 2: Environment Variable Injection - SIMPLE ✨

**Pros**:
- ✅ No external dependencies (no Redis needed)
- ✅ Works immediately
- ✅ Simple implementation

**Cons**:
- ⚠️ Manual session refresh needed
- ⚠️ Environment variables have size limits (4KB)

**Implementation**:

#### Step 1: Export Session as Base64

Create `scripts/export-session-env.ts`:

```typescript
import fs from 'fs/promises';
import path from 'path';

async function exportSession() {
  try {
    const sessionPath = path.join(process.cwd(), '.cache', 'mtn-session.json');
    const sessionData = await fs.readFile(sessionPath, 'utf-8');
    const session = JSON.parse(sessionData);

    // Convert to base64
    const sessionBase64 = Buffer.from(JSON.stringify(session)).toString('base64');

    console.log('');
    console.log('='.repeat(60));
    console.log('MTN SSO Session - Environment Variable');
    console.log('='.repeat(60));
    console.log('');
    console.log('Add this to your Vercel environment variables:');
    console.log('');
    console.log('Variable Name: MTN_SESSION');
    console.log('Variable Value (copy below):');
    console.log('');
    console.log(sessionBase64);
    console.log('');
    console.log('='.repeat(60));
    console.log('');
    console.log('Instructions:');
    console.log('1. Copy the base64 value above');
    console.log('2. Go to Vercel Dashboard → Settings → Environment Variables');
    console.log('3. Add: MTN_SESSION = <paste-value>');
    console.log('4. Select environments: Production, Staging');
    console.log('5. Save and redeploy');
    console.log('');
    console.log('Session expires at:', session.expiresAt);
    console.log('');

  } catch (error) {
    console.error('Error exporting session:', error);
    process.exit(1);
  }
}

exportSession();
```

#### Step 2: Update Auth Service to Read from Env

Update `lib/services/mtn-sso-auth.ts`:

```typescript
/**
 * Get session from environment variable (for Vercel)
 */
private async loadSessionFromEnv(): Promise<AuthSession | null> {
  try {
    const sessionBase64 = process.env.MTN_SESSION;

    if (!sessionBase64) {
      return null;
    }

    const sessionJson = Buffer.from(sessionBase64, 'base64').toString('utf-8');
    const session = JSON.parse(sessionJson);

    return {
      ...session,
      expiresAt: new Date(session.expiresAt)
    };
  } catch (error) {
    console.error('[MTN SSO] Error loading session from env:', error);
    return null;
  }
}

/**
 * Get auth session (updated to check env first for Vercel)
 */
public async getAuthSession(): Promise<AuthResult> {
  try {
    // Priority 1: Check environment variable (for Vercel)
    if (process.env.VERCEL) {
      const envSession = await this.loadSessionFromEnv();
      if (envSession && this.isSessionValid(envSession)) {
        console.log('[MTN SSO] Using session from environment variable');
        this.currentSession = envSession;
        return {
          success: true,
          cookies: envSession.cookies,
          sessionId: envSession.sessionId,
          expiresAt: envSession.expiresAt
        };
      }
    }

    // Priority 2: Check in-memory cache
    if (this.currentSession && this.isSessionValid(this.currentSession)) {
      console.log('[MTN SSO] Using cached session');
      return {
        success: true,
        cookies: this.currentSession.cookies,
        sessionId: this.currentSession.sessionId,
        expiresAt: this.currentSession.expiresAt
      };
    }

    // Priority 3: Check file cache (local development)
    const cachedSession = await this.loadCachedSession();
    if (cachedSession && this.isSessionValid(cachedSession)) {
      console.log('[MTN SSO] Using file-cached session');
      this.currentSession = cachedSession;
      return {
        success: true,
        cookies: cachedSession.cookies,
        sessionId: cachedSession.sessionId,
        expiresAt: cachedSession.expiresAt
      };
    }

    // No valid session - in production, this is an error
    if (process.env.VERCEL) {
      return {
        success: false,
        error: 'No valid session. Update MTN_SESSION environment variable.'
      };
    }

    // Local development - authenticate
    console.log('[MTN SSO] No valid session, authenticating...');
    return await this.authenticate();

  } catch (error) {
    console.error('[MTN SSO] Error getting auth session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

#### Step 3: Deployment Workflow

```bash
# 1. Authenticate locally
npx tsx scripts/test-mtn-sso-auth.ts --manual

# 2. Export session to env variable format
npx tsx scripts/export-session-env.ts

# 3. Copy the base64 value and add to Vercel:
# Production: https://vercel.com/jdewee-livecoms-projects/circletel/settings/environment-variables
# Staging: https://vercel.com/jdewee-livecoms-projects/circletel-stagging/settings/environment-variables

# 4. Deploy
vercel --prod  # or just `vercel` for staging
```

---

### Option 3: GitHub Actions Pre-Deploy - AUTOMATED 🤖

**Pros**:
- ✅ Fully automated
- ✅ Session refreshed on every deploy
- ✅ No manual intervention

**Implementation**:

Create `.github/workflows/deploy-with-mtn-auth.yml`:

```yaml
name: Deploy to Vercel with MTN SSO

on:
  push:
    branches:
      - main        # Production
      - staging     # Staging

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install chromium

      - name: Authenticate with MTN SSO
        env:
          MTN_USERNAME: ${{ secrets.MTN_USERNAME }}
          MTN_PASSWORD: ${{ secrets.MTN_PASSWORD }}
        run: |
          # Run manual auth (requires 2Captcha integration for full automation)
          npx tsx scripts/test-mtn-sso-auth.ts

      - name: Upload session to Vercel KV
        env:
          KV_REST_API_URL: ${{ secrets.KV_REST_API_URL }}
          KV_REST_API_TOKEN: ${{ secrets.KV_REST_API_TOKEN }}
        run: |
          npx tsx scripts/upload-session-to-kv.ts --env=${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}

      - name: Deploy to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
        run: |
          if [ "${{ github.ref }}" == "refs/heads/main" ]; then
            vercel --prod --token=$VERCEL_TOKEN
          else
            vercel --token=$VERCEL_TOKEN
          fi
```

**Note**: This requires 2Captcha integration to fully automate reCAPTCHA solving.

---

## 🚀 Recommended Deployment Workflow

### Setup (One-Time)

#### Step 1: Set Environment Variables in Vercel

**Production** (https://vercel.com/jdewee-livecoms-projects/circletel):
```bash
# Go to: Settings → Environment Variables

MTN_USERNAME=Lindokuhle.mdake@circletel.co.za
MTN_PASSWORD=Lwandle@1992*
```

**Staging** (https://vercel.com/jdewee-livecoms-projects/circletel-stagging):
```bash
# Go to: Settings → Environment Variables

MTN_USERNAME=Lindokuhle.mdake@circletel.co.za
MTN_PASSWORD=Lwandle@1992*
```

#### Step 2: Choose Your Strategy

**Option A: Vercel KV (Recommended)**
```bash
# 1. Add Vercel KV to project
vercel env pull

# 2. Install KV SDK
npm install @vercel/kv

# 3. Update environment variables
vercel env add KV_REST_API_URL
vercel env add KV_REST_API_TOKEN
```

**Option B: Environment Variable (Simpler)**
```bash
# Just add MTN_SESSION variable (see Option 2 above)
```

---

### Deployment Process

#### For Vercel KV Method:

```bash
# 1. Authenticate locally
npx tsx scripts/test-mtn-sso-auth.ts --manual

# 2. Upload to KV
npx tsx scripts/upload-session-to-kv.ts --env=production

# 3. Deploy
vercel --prod

# For staging:
npx tsx scripts/upload-session-to-kv.ts --env=staging
vercel
```

#### For Environment Variable Method:

```bash
# 1. Authenticate locally
npx tsx scripts/test-mtn-sso-auth.ts --manual

# 2. Export session
npx tsx scripts/export-session-env.ts

# 3. Copy base64 value to Vercel dashboard
# Production: https://vercel.com/jdewee-livecoms-projects/circletel/settings/environment-variables
# Staging: https://vercel.com/jdewee-livecoms-projects/circletel-stagging/settings/environment-variables

# 4. Deploy
vercel --prod  # or `vercel` for staging
```

---

## 📝 Step-by-Step: Environment Variable Method (Easiest)

### Production Deployment

```bash
# Step 1: Authenticate
cd /c/Projects/circletel-nextjs
npx tsx scripts/test-mtn-sso-auth.ts --manual

# Step 2: Export session
npx tsx scripts/export-session-env.ts

# Step 3: Go to Vercel Dashboard
# https://vercel.com/jdewee-livecoms-projects/circletel/settings/environment-variables

# Step 4: Add MTN_SESSION variable
# - Name: MTN_SESSION
# - Value: <paste-base64-from-step-2>
# - Environment: Production
# - Save

# Step 5: Add credentials (if not already added)
# - MTN_USERNAME: Lindokuhle.mdake@circletel.co.za
# - MTN_PASSWORD: Lwandle@1992*

# Step 6: Deploy
vercel --prod
```

### Staging Deployment

```bash
# Follow same steps but:
# - Use staging dashboard: https://vercel.com/jdewee-livecoms-projects/circletel-stagging/settings/environment-variables
# - Deploy with: vercel (without --prod)
```

---

## 🔄 Session Refresh Workflow

Sessions expire after ~1 hour. Here's how to refresh:

### Manual Refresh (Recommended for now)

```bash
# When you get "No valid session" errors:

# 1. Re-authenticate
npx tsx scripts/test-mtn-sso-auth.ts --manual

# 2. Export new session
npx tsx scripts/export-session-env.ts

# 3. Update MTN_SESSION in Vercel dashboard

# 4. Redeploy (optional - env vars update automatically)
```

### Automated Refresh (Future)

Set up cron job or scheduled action:

```yaml
# .github/workflows/refresh-mtn-session.yml
name: Refresh MTN Session

on:
  schedule:
    - cron: '0 */12 * * *'  # Every 12 hours

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - # Authenticate and update MTN_SESSION
```

---

## 🧪 Testing After Deployment

### Verify Production

```bash
# Check auth status
curl https://circletel.vercel.app/api/mtn-wholesale/auth

# Test products API
curl https://circletel.vercel.app/api/mtn-wholesale/products

# Test feasibility
curl -X POST https://circletel.vercel.app/api/mtn-wholesale/feasibility \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": [{
      "latitude": "-26.2041",
      "longitude": "28.0473",
      "customer_name": "Test"
    }],
    "product_names": ["Wholesale Cloud Connect"],
    "requestor": "test@circletel.co.za"
  }'
```

### Verify Staging

```bash
# Replace with staging URL
curl https://circletel-stagging.vercel.app/api/mtn-wholesale/products
```

---

## 🚨 Troubleshooting

### Issue: "No valid session" in production

**Solution**:
```bash
# 1. Check if MTN_SESSION is set
vercel env ls

# 2. Verify session hasn't expired
# Decode base64 and check expiresAt

# 3. Re-authenticate and update
npx tsx scripts/test-mtn-sso-auth.ts --manual
npx tsx scripts/export-session-env.ts
# Update Vercel env var
```

### Issue: Playwright not working in Vercel

**Solution**: Playwright doesn't run in Vercel serverless functions. Use:
- Local authentication → Upload session to KV/env
- Or: Use Playwright on external service (GitHub Actions, separate server)

### Issue: Session expires too quickly

**Solution**:
1. Set up automated refresh (GitHub Actions)
2. Or: Implement session renewal before expiry
3. Or: Use longer-lived OAuth tokens (if MTN supports)

---

## 📊 Deployment Checklist

### Pre-Deployment

- [ ] MTN_USERNAME set in Vercel (both envs)
- [ ] MTN_PASSWORD set in Vercel (both envs)
- [ ] Authenticate locally: `npx tsx scripts/test-mtn-sso-auth.ts --manual`
- [ ] Export session: `npx tsx scripts/export-session-env.ts`
- [ ] Update MTN_SESSION in Vercel dashboard
- [ ] Verify session expiry time (should be >30 minutes)

### Deployment

- [ ] Deploy to staging first: `vercel`
- [ ] Test staging APIs
- [ ] If successful, deploy to prod: `vercel --prod`
- [ ] Test production APIs

### Post-Deployment

- [ ] Monitor Vercel logs for auth errors
- [ ] Set calendar reminder for session refresh (45 minutes)
- [ ] Document session refresh workflow for team

---

## 🎯 Recommended Approach

**For immediate deployment**:
1. Use **Option 2: Environment Variable Injection** (simplest)
2. Follow step-by-step guide above
3. Set calendar reminder to refresh session every 45 minutes

**For production-ready solution**:
1. Implement **Option 1: Vercel KV** (most robust)
2. Set up automated session refresh
3. Add monitoring and alerts

---

## 📞 Support

**Vercel Dashboards**:
- Production: https://vercel.com/jdewee-livecoms-projects/circletel
- Staging: https://vercel.com/jdewee-livecoms-projects/circletel-stagging

**Quick Commands**:
```bash
# Local auth
npx tsx scripts/test-mtn-sso-auth.ts --manual

# Export for Vercel
npx tsx scripts/export-session-env.ts

# Deploy
vercel --prod  # production
vercel         # staging
```

---

**Next Steps**: Choose your deployment method and follow the step-by-step guide above.
