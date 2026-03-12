# Unjani Network Infrastructure Management

**Date**: 2026-03-07
**Duration**: ~2 hours
**Scope**: Database schema, admin UI, network architecture clarification

## Context

CircleTel deploys connectivity to Unjani clinic sites using two different network paths:
1. **CircleTel BNG** (Tarana FWB) - PPPoE via Interstellio RADIUS
2. **MTN Breakout** (LTE/5G) - Direct MTN internet, no Interstellio

## Key Insight: Dual Network Architecture

```
TARANA FWB SITES (12 sites)
───────────────────────────
Site Router → PPPoE → CircleTel ECHO SP BNG → Interstellio RADIUS → Internet
Management: Via L2TP tunnel to 34.35.85.28 (10.125.x.x)

MTN LTE/5G SITES (10 sites)
──────────────────────────
Tozed 4G Router → MTN Network → Internet
Management: Via MTN Static IP (41.119.x.x) - NO Interstellio needed
```

## Friction Point: "Missing" Sites

**Initial Assumption**: 7 sites were "missing" from Interstellio and needed provisioning.

**Reality**: These sites use MTN LTE/5G breakout - they bypass CircleTel's BNG entirely. The PPPoE credentials in the schedule were placeholders.

**Lesson**: Always clarify network path before assuming provisioning is needed.

## Schema Extension Decision

**Question**: Add columns to `corporate_sites` or create new `unjani_site_network` table?

**Decision**: Add columns to existing table.

**Rationale**:
- Fields extend the existing entity (site hardware details)
- Enum types keep values constrained
- Avoids JOIN complexity in queries
- `corporate_sites` already has some site-specific fields (router_serial)

**Added columns**:
- `network_path` (enum: circletel_bng, mtn_breakout)
- `technology` (enum: tarana_fwb, lte_5g, ftth, fwa)
- Hardware serials: tarana_rn_serial, mikrotik_serial, ruijie_ap_serial
- MTN-specific: mtn_router_imei, mtn_router_mac, mtn_static_ip
- Integration: interstellio_subscriber_id, ruijie_device_sn

## Conditional Form Fields Pattern

Show/hide form sections based on network path and technology selection:

```tsx
{/* Show MTN fields only for MTN breakout */}
{formData.networkPath === 'mtn_breakout' && (
  <>
    <Input id="mtnRouterImei" ... />
    <Input id="mtnStaticIp" ... />
  </>
)}

{/* Show Tarana fields only for Tarana FWB */}
{formData.technology === 'tarana_fwb' && (
  <Input id="taranaRnSerial" ... />
)}
```

## Migration Seed Data Pattern

**Problem**: INSERT with ON CONFLICT (corporate_id, site_number) fails when site_number is auto-generated.

**Solution**: UPDATE by unique account_number instead:

```sql
-- WRONG: Conflict on auto-generated column
INSERT INTO corporate_sites (corporate_id, site_name, ...)
ON CONFLICT (corporate_id, site_number) DO UPDATE ...

-- RIGHT: Update by unique identifier
UPDATE corporate_sites SET
  network_path = 'circletel_bng',
  technology = 'tarana_fwb',
  tarana_rn_serial = 'S150F2224001002'
WHERE account_number = 'CT-UNJ-006';
```

## Files Created/Modified

| File | Purpose |
|------|---------|
| `supabase/migrations/20260307000003_add_unjani_network_columns.sql` | Schema + enums |
| `lib/corporate/types.ts` | Added NetworkPathType, SiteTechnologyType |
| `lib/corporate/site-service.ts` | Extended update() and mapSite() |
| `app/admin/corporate/[id]/page.tsx` | Technology/Network columns |
| `app/admin/corporate/[id]/sites/[siteId]/page.tsx` | Network Infrastructure section |
| `.docs/UNJANI_SITE_INVENTORY.md` | Site inventory documentation |

## Time Savings for Future

| Task | Without Pattern | With Pattern |
|------|-----------------|--------------|
| Understand network architecture | 30+ min | 5 min (read this doc) |
| Add conditional form fields | 20 min | 5 min (copy pattern) |
| Seed existing data | 15 min debugging | 5 min (use UPDATE) |
