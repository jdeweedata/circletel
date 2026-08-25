# Ruijie per-client STA traffic rollups

**Status:** Live collection (forward-only from 2026-08-11)  
**Audience:** CircleTel admin / ops

## What we collect

Every 5 minutes, Inngest `ruijie-ssid-sta-sampler` pulls Ruijie `/sta/sta_users` and credits positive session-byte deltas into:

| Table | Grain | Use |
|-------|-------|-----|
| `ruijie_ssid_traffic_rollups` | AP + SSID + hour | Usage Reports Staff / Free WiFi site totals |
| `ruijie_ssid_sta_traffic_rollups` | AP + **client MAC** + SSID + hour | Per-device usage going forward |
| `ruijie_ssid_sta_sample_state` | AP + MAC + SSID | Checkpoint only (~36h); not history |

**Allow-listed SSIDs only:** `Unjani Clinic Staff`, `Unjani Clinic Free WiFi`.

Optional last-seen fields on the client hour row: `hostname`, `manufacture`, `band`.

## Retention and access

- Rollups: **90 days** (same prune job as SSID table)
- Access: **admin users** (RLS) + service role writers
- MAC / hostname are personal telemetry under POPIA — do not put raw MACs in customer-facing PDFs without an explicit anonymisation decision

## Query helpers

```ts
import {
  loadClientHourRows,
  summarizeTopClients,
} from '@/lib/ruijie/sta-client-rollups';

const rows = await loadClientHourRows(supabase, siteId, startUtc, endUtc, 'Unjani Clinic Staff');
const top = summarizeTopClients(rows, 20);
```

## Caveats

- Forward-only — no historical backfill before this table existed
- First sample after a client appears is a baseline (0 credit) to avoid dumping long-lived session counters
- Short sessions between 5-minute polls may undercount
- Not accounting-grade billing data

## Ops

After deploy: ensure migration applied, then Inngest re-register (`PUT /api/inngest`) if the function definition changed. Within ~1 hour of allow-listed traffic, `ruijie_ssid_sta_traffic_rollups` should show non-zero rows for active Unjani clinics.
