# Tarana Portal API Integration

**Date**: 2026-02-19
**Category**: External API Integration
**Impact**: High - Enables live SkyFibre coverage validation

## Summary

Integrated Tarana TCS Portal API to provide real-time base station data for SkyFibre coverage checks, replacing static Excel imports with live API sync.

## Files Created

| File | Purpose |
|------|---------|
| `lib/tarana/types.ts` | TypeScript interfaces for Tarana API |
| `lib/tarana/auth.ts` | JWT authentication with token caching |
| `lib/tarana/client.ts` | API client for radios and network data |
| `lib/tarana/index.ts` | Module exports |
| `lib/tarana/sync-service.ts` | Sync BN data from API to database |
| `app/api/cron/tarana-sync/route.ts` | Cron endpoint for daily sync |

## Files Modified

| File | Changes |
|------|---------|
| `lib/coverage/mtn/base-station-service.ts` | Added `checkBaseStationProximityLive()` |
| `app/admin/sales/feasibility/page.tsx` | Enhanced Tarana display with BN proximity |
| `.env.example` | Added TARANA_USERNAME, TARANA_PASSWORD |
| `vercel.json` | Added cron schedule (daily at midnight) |

## Key Patterns

### 1. JWT Token Caching Pattern

```typescript
// lib/tarana/auth.ts
interface TokenCache {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

export async function getAccessToken(): Promise<string> {
  // Return cached token if valid (with 1-min buffer)
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.accessToken;
  }

  // Re-authenticate and cache
  const auth = await authenticateTarana();
  tokenCache = {
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    expiresAt: Date.now() + (auth.expiresIn * 1000) - 60000 // 1-min buffer
  };
  return auth.accessToken;
}
```

**When to use**: Any external API with expiring tokens (Zoho, Didit, etc.)

### 2. Database Sync Service Pattern

```typescript
// lib/tarana/sync-service.ts
export async function syncBaseStations(options: {
  deleteStale?: boolean;
  dryRun?: boolean;
} = {}): Promise<SyncResult> {
  const { deleteStale = false, dryRun = false } = options;

  // 1. Fetch from external API
  const apiData = await getAllBaseNodes();

  // 2. Get existing records
  const { data: existing } = await supabase
    .from('tarana_base_stations')
    .select('serial_number');

  const existingSet = new Set(existing?.map(e => e.serial_number) || []);
  const apiSet = new Set<string>();

  // 3. Upsert logic
  for (const item of apiData) {
    apiSet.add(item.serialNumber);

    if (existingSet.has(item.serialNumber)) {
      // Update existing
      await supabase.from('table').update(record).eq('id', item.id);
      updated++;
    } else {
      // Insert new
      await supabase.from('table').insert(record);
      inserted++;
    }
  }

  // 4. Optional: Delete stale records
  if (deleteStale) {
    const stale = [...existingSet].filter(s => !apiSet.has(s));
    await supabase.from('table').delete().in('serial_number', stale);
  }

  return { inserted, updated, deleted, errors };
}
```

**When to use**: Any external data that needs periodic sync to local database

### 3. Live API with Database Fallback

```typescript
// lib/coverage/mtn/base-station-service.ts
export async function checkBaseStationProximityLive(
  coordinates: Coordinates,
  options: { useLiveApi?: boolean } = {}
): Promise<BaseStationProximityResult> {

  // Try live API if requested and authenticated
  if (options.useLiveApi && hasTaranaAuth()) {
    try {
      const result = await searchRadios('BN', { limit: 100 });
      // Process and return...
      return buildProximityResult(coordinates, stations);
    } catch (error) {
      console.error('Live API failed, falling back:', error);
    }
  }

  // Fall back to database
  return checkBaseStationProximity(coordinates, options);
}
```

**When to use**: Real-time data with resilience requirements

## Tarana API Reference

### Authentication
- **Endpoint**: `POST /api/tcs/v1/user-auth/login`
- **Body**: `{ username, password }`
- **Returns**: JWT tokens (AWS Cognito)

### Search Radios
- **Endpoint**: `POST /api/tmq/v1/radios/search`
- **Auth**: Bearer token
- **Body**: Query with deviceType, pagination, conditions

### Constants
- **MTN Operator ID**: 219
- **SA Region IDs**: [1073, 1071]
- **Portal URL**: https://portal.tcs.taranawireless.com

## Environment Variables

```bash
TARANA_USERNAME=email@circletel.co.za
TARANA_PASSWORD=password
```

## Testing

```bash
# Dry run sync
curl -X POST http://localhost:3000/api/cron/tarana-sync \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}'

# Actual sync
curl -X POST http://localhost:3000/api/cron/tarana-sync \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false}'
```

## Friction Points

1. **Vercel CLI auth**: Token not in environment - created `.vercel/project.json` manually
2. **Type check path aliases**: Direct `tsc` on single files fails - use `npm run type-check | grep <file>`

## Related Files

- Database table: `tarana_base_stations` (created in `20251209_create_tarana_base_stations.sql`)
- RPC function: `find_nearest_tarana_base_station` (PostGIS proximity)
- Feasibility page: `/admin/sales/feasibility`
