# MTN SSO Authentication - Quick Start Guide

**⏱️ 5-Minute Setup**

---

## Step 1: Verify Environment (30 seconds)

```bash
# Check if dev server is running
curl http://localhost:3000/api/health

# Should return: {"status":"healthy",...}
```

If not running:
```bash
cd /c/Projects/circletel-nextjs
npm run dev
```

---

## Step 2: Run Manual Authentication (2-3 minutes)

```bash
npx tsx scripts/test-mtn-sso-auth.ts --manual
```

**What to do**:
1. Browser window opens automatically
2. **Credentials are auto-filled** ✅
3. **Solve the reCAPTCHA** 🤖 (this is the manual part)
4. Click **LOGIN** button
5. Wait for redirect
6. Browser closes automatically

**Success Output**:
```
✅ Status: SUCCESS
Session ID: mtn_xxx
Expires At: 2025-10-17T09:30:00.000Z
✅ Session cached successfully
```

---

## Step 3: Test MTN API (1 minute)

### Get Available Products

```bash
curl http://localhost:3000/api/mtn-wholesale/products
```

**Expected**:
```json
{
  "error_code": "200",
  "error_message": "operation successful",
  "results": [
    "Wholesale Business Broadband",
    "Wholesale Cloud Connect"
  ]
}
```

### Check Feasibility

```bash
curl -X POST http://localhost:3000/api/mtn-wholesale/feasibility \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": [{
      "latitude": "-26.2041",
      "longitude": "28.0473",
      "customer_name": "CircleTel"
    }],
    "product_names": ["Wholesale Cloud Connect"],
    "requestor": "test@circletel.co.za"
  }'
```

**Expected**:
```json
{
  "error_code": "200",
  "outputs": [{
    "customer_name": "CircleTel",
    "product_results": [{
      "product_name": "Wholesale Cloud Connect",
      "product_feasible": "yes",
      "product_region": "GAUTENG SOUTH"
    }]
  }]
}
```

---

## Step 4: Verify Session (30 seconds)

```bash
# Check auth status
curl http://localhost:3000/api/mtn-wholesale/auth
```

**Expected**:
```json
{
  "success": true,
  "authenticated": true,
  "sessionId": "mtn_xxx",
  "expiresAt": "2025-10-17T09:30:00.000Z",
  "cookiesCount": 5
}
```

---

## ✅ You're Done!

The MTN SSO authentication is now working. Here's what happens automatically:

1. **Session Cached**: Stored in `.cache/mtn-session.json`
2. **Auto-Reuse**: All API calls use cached session (no re-auth needed)
3. **Auto-Refresh**: Re-authenticates automatically when session expires
4. **Session Duration**: ~1 hour (then auto re-auth)

---

## Common Commands

### Clear Session & Re-authenticate

```bash
curl -X DELETE http://localhost:3000/api/mtn-wholesale/auth
npx tsx scripts/test-mtn-sso-auth.ts --manual
```

### Test Full Workflow

```bash
npx tsx scripts/test-mtn-sso-auth.ts --clear --manual --test-api
```

### Check Cached Session

```bash
cat .cache/mtn-session.json | head -20
```

---

## Troubleshooting

### ❌ "Authentication failed"

**Check credentials**:
```bash
# Verify environment variables
echo $MTN_USERNAME
echo $MTN_PASSWORD
```

**Solution**: Add to `.env.local`:
```env
MTN_USERNAME=Lindokuhle.mdake@circletel.co.za
MTN_PASSWORD=Lwandle@1992*
```

### ❌ "reCAPTCHA validation failed"

**Solution**: Use manual mode (it's the only way currently):
```bash
npx tsx scripts/test-mtn-sso-auth.ts --manual
```

### ❌ API returns 401/403

**Session expired or invalid**:
```bash
# Clear cache and re-authenticate
curl -X DELETE http://localhost:3000/api/mtn-wholesale/auth
npx tsx scripts/test-mtn-sso-auth.ts --manual
```

### ❌ "Session appears invalid"

**Check if session expired**:
```bash
curl http://localhost:3000/api/mtn-wholesale/auth
# If authenticated: false, re-authenticate
npx tsx scripts/test-mtn-sso-auth.ts --manual
```

---

## What's Next?

### Use in Your Code

```typescript
import { mtnSSOAuth } from '@/lib/services/mtn-sso-auth';

export async function GET() {
  const auth = await mtnSSOAuth.getAuthSession();
  const cookies = await mtnSSOAuth.getCookieHeader();

  const response = await fetch('https://asp-feasibility.mtnbusiness.co.za/api/...', {
    headers: { 'Cookie': cookies || '' }
  });

  return NextResponse.json(await response.json());
}
```

### Production Deployment

1. Set environment variables:
   ```bash
   vercel env add MTN_USERNAME
   vercel env add MTN_PASSWORD
   ```

2. Pre-cache session before deployment:
   ```bash
   npx tsx scripts/test-mtn-sso-auth.ts --manual
   ```

3. Deploy:
   ```bash
   vercel --prod
   ```

---

## Documentation

- **Full Guide**: `docs/integrations/MTN_SSO_AUTHENTICATION.md`
- **Implementation Summary**: `docs/integrations/MTN_SSO_IMPLEMENTATION_SUMMARY.md`
- **Test Report**: `docs/testing/MTN_API_TEST_REPORT.md`

---

## Support

**Need help?**
1. Check server logs: Look for `[MTN SSO]` messages
2. Run test script: `npx tsx scripts/test-mtn-sso-auth.ts --manual`
3. Verify session: `curl http://localhost:3000/api/mtn-wholesale/auth`

---

**Quick Start Complete** ✅

Your MTN SSO authentication is configured and ready to use!
