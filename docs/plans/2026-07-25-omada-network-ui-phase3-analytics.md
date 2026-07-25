# Omada-inspired Network UI — Phase 3 (Analytics)

**Date:** 2026-07-25  
**Status:** Implemented  
**Route:** `/admin/network/analytics`

## Scope
- Keep rollup throughput KPIs + Cached/Live toggle
- Top applications via Ruijie `flow/app` — empty state when none
- Group traffic cards from `ruijie_traffic_rollups` when present
- SSID activity from live STA client counts (not invented byte traffic)
- Channel/radio util from `ruijie_device_cache` — empty if missing; no fake dBm density

## Key files
- `app/api/admin/network/analytics/route.ts`
- `app/admin/network/analytics/page.tsx`
- `lib/network/analytics-aggregates.ts`
- `components/admin/network/performance/{TopApplicationsCard,GroupTrafficCards,RadioUtilSummaryCard,AnalyticsEmptyState}.tsx`
