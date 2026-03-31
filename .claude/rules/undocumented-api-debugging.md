Rule: undocumented-api-debugging
Loaded by: CLAUDE.md
Scope: Debugging undocumented or third-party APIs returning 4xx/5xx errors
Source: 1 session (tarana-tcs-api-correction 2026-03-31) — foundational enough to capture at 1 occurrence

---

## When to Apply

When an external API returns unexpected 400/403/500 errors and the API is:
- Undocumented or has incomplete docs
- A vendor portal designed for browser use
- Using a non-standard auth mechanism

---

## Rule: Browser-First Inspection

**Before guessing request formats, capture what the browser actually sends.**

Use Playwright to launch Chrome and capture the real network requests:

```typescript
// scripts/capture-api-requests.ts
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

// Capture all requests
page.on('request', req => {
  if (req.url().includes('your-api.com')) {
    console.log(req.method(), req.url());
    console.log('Headers:', JSON.stringify(req.headers(), null, 2));
    if (req.postData()) console.log('Body:', req.postData());
  }
});

page.on('response', res => {
  if (res.url().includes('your-api.com')) {
    console.log('Set-Cookie:', res.headers()['set-cookie']);
  }
});

await page.goto('https://your-api.com/login');
// Manually log in — observe what gets captured
```

**Why**: Vendor portals often use non-standard auth (cookies, Basic Auth, custom headers) that differs from their documentation. The browser doesn't lie.

---

## Rule: Detect Cookie-Based Auth

**Check if the API uses httpOnly cookies instead of Bearer tokens.**

Signs it's cookie-based:
- Login response has `Set-Cookie` headers with session tokens
- Browser DevTools shows no `Authorization` header on API calls
- Tokens have names like `idToken`, `accessToken`, `userId`, `session`

**Pattern for cookie extraction (Node.js 18+):**

```typescript
function extractCookies(loginResponse: Response): string {
  const raw = loginResponse.headers as unknown as { getSetCookie?: () => string[] };
  const setCookieValues = typeof raw.getSetCookie === 'function'
    ? raw.getSetCookie()
    : (() => {
        const vals: string[] = [];
        loginResponse.headers.forEach((value, name) => {
          if (name.toLowerCase() === 'set-cookie') vals.push(value);
        });
        return vals;
      })();

  return setCookieValues
    .map(s => s.split(';')[0].trim())   // Take name=value, strip Secure/HttpOnly/Path
    .filter(Boolean)
    .join('; ');
}

// Use in subsequent requests:
headers: { 'Cookie': extractCookies(loginResponse) }
```

---

## Rule: Istio/Envoy Gateway Rejection Signal

**`x-envoy-upstream-service-time: 1` (1ms) = request rejected by API gateway, never reached the backend.**

| Response time | Meaning |
|---------------|---------|
| `x-envoy: 1` (1ms) | Istio/Envoy blocked the request — check headers |
| `x-envoy: 100-500ms` | Request reached the backend service |

**Common causes of gateway rejection:**
- Missing `User-Agent` header (bot detection)
- Missing `Referer` or `Origin` header
- Missing custom headers like `X-Caller-Name`
- Wrong `Content-Type`

**Browser-like headers that bypass Istio validation:**

```typescript
const BROWSER_HEADERS = {
  'Accept': 'application/json, text/plain, */*',
  'Referer': 'https://portal.vendor.com/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  // Plus any vendor-specific headers discovered via browser capture
};
```

---

## Debugging Checklist for API 500/403 Errors

1. **Check `x-envoy-upstream-service-time` header** — if 1ms, it's gateway rejection
2. **Add browser-like headers** (User-Agent, Referer, Accept)
3. **Use Playwright to capture real browser requests** — see exact headers/body/cookies
4. **Check if auth is cookie-based** — look for Set-Cookie in login response
5. **Test one operation at a time** — auth first, then simplest read endpoint
6. **Check for Basic Auth** — some portals use `Authorization: Basic base64(user:pass)` not JSON body

## Common Mistakes

| Wrong assumption | Reality | How to detect |
|-----------------|---------|---------------|
| API uses JSON body login | API uses HTTP Basic Auth | Playwright capture |
| API uses Bearer tokens | API uses httpOnly cookies | Check Set-Cookie headers |
| Any operation works in search | Only EXIST/IN/EQ may be valid | Try each, document failures |
| API docs are correct | Docs describe v1; portal runs v3 | Browser capture reveals actual endpoints |
