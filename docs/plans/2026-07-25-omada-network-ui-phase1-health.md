# Omada-inspired Network UI — Phase 1 (System Health)

**Date:** 2026-07-25  
**Status:** Approved for implementation  
**Branch:** `cursor/network-performance-dashboard`

## Decisions
- Port Omada patterns into CircleTel React (not Vue embed, not pixel-perfect Omada skin)
- Phase order: Health → Devices → Analytics
- Data: real Ruijie/Supabase only; Omada-style empty states when fields missing
- Phase 1 scope: enhance `/admin/network/health` only

## Phase 1 deliverables
1. **Network Overview tiles** — Gateway / AP / Switch (online/total) / Client / Guest from `ruijie_device_cache` (+ model heuristics)
2. **Pending Alerts card** — restyle existing `unacknowledgedAlerts` to Omada-like list
3. **Edge / primary device card** — best-effort gateway or highest-client online device; CPU/mem/radio; no fake port map if unsupported
4. Keep existing System Health KPI row, resource bars, bandwidth, devices table

## Out of Phase 1
- Devices page chips/drawer
- Analytics SSID/app/density widgets
- Topology

## Success
- Health page shows overview tiles + alerts + edge card with live cache data
- Missing roles/metrics show empty/— not mock numbers
- Aggregate unit tests for inventory classification
