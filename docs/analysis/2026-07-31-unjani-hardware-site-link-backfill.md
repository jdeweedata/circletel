# Unjani hardware ↔ corporate_sites backfill

**Date:** 2026-07-31  
**Ticket:** [#674](https://github.com/jdeweedata/circletel/issues/674)  
**Map:** [#672](https://github.com/jdeweedata/circletel/issues/672)

## What was done

1. **Schema:** added `network_devices.corporate_site_id` → `corporate_sites(id)` (migration `20260731220000_network_devices_corporate_site_id.sql`), applied to prod.
2. **Backfill script:** `scripts/backfill-unjani-hardware-site-links.ts`  
   - Source of truth for matches: `service_network_identifiers` (`ruijie_sn`) → `corporate_sites.service_id`  
   - Sets `corporate_sites.ruijie_device_sn` (primary AP when multi-AP)  
   - Sets `network_devices.corporate_site_id` + `ruijie_device_sn`  
   - Upserts `ruijie_device_cache` stubs when Cloud sync cache is empty (FK required for `network_devices.ruijie_device_sn`)

## Before → after

| Metric | Before | After |
|--------|--------|-------|
| Unjani sites with `ruijie_device_sn` | 1 / 26 | **20 / 26** |
| `network_devices` (ruijie_ap) with `corporate_site_id` | 0 | **23** |
| `ruijie_device_cache` rows | **0** (sync empty) | **23** stubs linked to sites |

Multi-AP sites (all APs linked to same site; primary on `corporate_sites.ruijie_device_sn`):

- Cosmo City (`CT-UNJ-007`): primary `G1U52HL044450` + `G1V30SM00301A`
- Barcelona (`CT-UNJ-013`): primary `G1UQ9C800686A` + `G1VQ3C8007507` + `G1U52HL044471`

## Residual (no Ruijie SN in SNI)

- CT-UNJ-001 Soweto (Diepkloof) — pending
- CT-UNJ-003 Khayelitsha — pending
- CT-UNJ-004 Mamelodi — pending
- CT-UNJ-005 Umlazi — pending
- CT-UNJ-022 Durban — has Tozed/SIM hardware, no Ruijie AP in SNI
- CT-UNJ-026 Delmas — pipeline / no AP

## Ops notes

- **`ruijie_device_cache` was empty** at backfill time — Ruijie Cloud sync needs investigation separately. Stubs are marked in `support_notes`; next healthy sync should refresh telemetry fields. Confirm sync upserts preserve `corporate_site_id`.
- Re-run: `set -a && source .env.local && set +a && npx tsx scripts/backfill-unjani-hardware-site-links.ts` (idempotent for already-linked rows).
- `DRY_RUN=1` prints the plan without writes.
