---
name: tarana-tcs-api-correction
description: Corrected Tarana TCS Portal auth (cookies, not Bearer), working vs broken endpoints, NQS device state, losRange metric
type: correction
---

# Tarana TCS Portal — Auth & Endpoint Corrections

**Date**: 2026-03-31
**Category**: External API Integration (Correction)
**Impact**: Critical — previous auth docs were wrong; all API calls failed with HTTP 500/403

---

## ⚠️ CORRECTION to 2026-02-19 Learnings

The 2026-02-19 learnings file (`tarana-portal-integration.md`) documents the wrong auth mechanism.

| Field | OLD (wrong) | CORRECT |
|-------|-------------|---------|
| Login method | JSON body `{ username, password }` | HTTP Basic Auth header |
| Subsequent auth | `Authorization: Bearer ${token}` | `Cookie: idToken=...; accessToken=...` |
| Token storage | `accessToken` from JSON response body | httpOnly cookies from `Set-Cookie` headers |

---

## Correct Authentication Flow

### Step 1: Login with HTTP Basic Auth

```typescript
const basicCredentials = Buffer.from(`${user}:${pass}`).toString('base64');

const response = await fetch(`${TARANA_API_BASE}/api/tcs/v1/user-auth/login`, {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${basicCredentials}`,
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://portal.tcs.taranawireless.com/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
    'X-Caller-Name': 'operator-portal',
    // NO Content-Type, NO request body
  },
});
// Response: { data: { accessToken, refreshToken, userId, session } }
// + Set-Cookie: idToken=...; accessToken=...; refreshToken=...; userId=...
```

### Step 2: Extract cookies from Set-Cookie headers

```typescript
function extractCookies(response: Response): string {
  const raw = response.headers as unknown as { getSetCookie?: () => string[] };
  const setCookieValues = typeof raw.getSetCookie === 'function'
    ? raw.getSetCookie()                     // Node 18+ preferred
    : (() => {
        const vals: string[] = [];
        response.headers.forEach((value, name) => {
          if (name.toLowerCase() === 'set-cookie') vals.push(value);
        });
        return vals;
      })();

  return setCookieValues
    .map(s => s.split(';')[0].trim())        // name=value only, strip attributes
    .filter(Boolean)
    .join('; ');
}
```

### Step 3: All API calls use Cookie header (no Authorization)

```typescript
await fetch(`${TARANA_API_BASE}/api/nqs/v1/devices/${sn}`, {
  headers: {
    'Cookie': cookies,    // From extractCookies() above
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://portal.tcs.taranawireless.com/',
    'X-Caller-Name': 'operator-portal',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
  },
});
```

---

## How This Was Discovered

**Playwright browser capture** — ran a script that launched Chrome with DevTools, captured every network request during the login flow. Revealed:
1. Login `POST` request has NO body, only `Authorization: Basic ...` header
2. Login response has `Set-Cookie` headers with 4 tokens
3. All subsequent API calls have NO `Authorization` header — only `Cookie`

**Istio gateway signal** — before the fix:
- `x-envoy-upstream-service-time: 1` (1ms) = Istio/Envoy rejected at gateway, never reached backend
- After adding browser-like headers: >100ms response = reached backend

---

## Working vs Broken Endpoints

### ✅ WORKING

| Endpoint | Purpose | Notes |
|----------|---------|-------|
| `POST /api/tcs/v1/user-auth/login` | Auth | Basic Auth + returns Set-Cookie |
| `GET /api/nqs/v1/devices/{sn}` | Per-device state | Best source of empirical data |
| `GET /api/tni/v2/sectors/{id}/devices?type=BN` | BN devices for sector | Returns install params |
| `GET /api/tni/v2/config_attributes` | YANG path catalog | 249 fields returned |
| `GET /api/tni/v2/operators/{id}/regions` | Region list | Working |
| `GET /api/nqs/v1/operators/{id}/network-hierarchy` | Hierarchy | Working |

### ❌ BROKEN / LIMITED

| Endpoint | Issue |
|----------|-------|
| `POST /api/tmq/v1/radios/search` | Only `EXIST` operation works; IN/EQUALS/CONTAINS all return 400. Cannot request signal YANG paths in outputSchema. |
| `POST /api/tmq/v5/radios/kpi/aggregate` | Only 2 valid KPI paths: `dl-subscriber-rate`, `ul-subscriber-rate`. All signal paths (RSSI, SINR, MCS, tx-power) return "Invalid kpi". Both valid paths return 0 data points. |

---

## NQS Device State — Key Fields

`GET /api/nqs/v1/devices/{serialNumber}` returns:

```typescript
{
  serialNumber: string,
  deviceType: 'BN' | 'RN',
  linkState: string,        // e.g. 'CONNECTED', 'DISCONNECTED'
  losRange: number,         // ⭐ Radio-measured LOS distance in METRES — more accurate than haversine
  sectorId: number,         // Link to parent BN sector
  band: string,
  carriers: [{
    id: number,
    txPower: number,        // dBm
    rxPower: number,
  }],
  installParams: {
    latitude: number,
    longitude: number,
    height: number,         // metres ASL
    azimuth: number,        // degrees
  },
  ancestry: {
    regionId, regionName, marketId, marketName,
    siteId, siteName, cellId, cellName, sectorId,
    sectorDetails: { name, id }
  }
}
```

### `losRange` is the key empirical metric

- **What it is**: The actual radio-measured line-of-sight distance between BN and RN
- **Why it matters**: More accurate than haversine (accounts for actual propagation geometry)
- **Use for**: Coverage prediction calibration, link budget validation
- **When absent**: Fall back to haversine from coordinates

---

## Constants (Verified)

```typescript
const TARANA_API_BASE = 'https://portal.tcs.taranawireless.com';
const MTN_OPERATOR_ID = 219;
const SA_REGION_IDS = [1073, 1071];  // KZN=1073, GP=1071 (approximate)
```

---

## Required Headers (All Requests)

The Istio gateway validates these — omitting them causes immediate rejection:

```typescript
const TARANA_BASE_HEADERS = {
  'Accept': 'application/json, text/plain, */*',
  'Referer': 'https://portal.tcs.taranawireless.com/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'X-Caller-Name': 'operator-portal',
};
```

---

## Files

- `lib/tarana/auth.ts` — Corrected auth (cookie-based)
- `lib/tarana/client.ts` — `taranaFetch`, `getDeviceBySerial`, `getBnDevicesForSector`
- `lib/tarana/metrics-service.ts` — `collectLinkMetrics` using NQS per-device queries
- `lib/tarana/types.ts` — `TaranaDeviceState`, `TaranaDeviceCarrier`, etc.
- `scripts/tarana/discover-fields.ts` — Lists all YANG paths from config_attributes
- `scripts/tarana/capture-cookies.ts` — Confirmed cookie-based auth pattern
