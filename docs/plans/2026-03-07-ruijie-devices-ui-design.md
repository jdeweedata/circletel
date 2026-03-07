# Ruijie Network Devices Page UI Redesign

**Date:** 2026-03-07
**Status:** Approved
**Page:** `/admin/network/devices`

## Overview

Improve the Ruijie devices admin page to serve both monitoring (at-a-glance health) and device management (actions) use cases equally, with full mobile responsiveness.

## Design Approach

**Approach 1: Stats Bar + Enhanced Table** — matches existing admin patterns (products, diagnostics), provides quick health overview while keeping table as primary workspace.

## Section 1: Summary StatCards

Four cards at top showing key metrics:

| Card | Label | Value Example | Icon | Color | Behavior |
|------|-------|---------------|------|-------|----------|
| 1 | Total Devices | `24` | `PiWifiHighBold` | Blue (`bg-blue-100`, `text-blue-600`) | Static |
| 2 | Online | `22 (92%)` | `PiCheckCircleBold` | Green (`bg-green-100`, `text-green-600`) | Click → filter to online |
| 3 | Offline | `2` | `PiWifiSlashBold` | Red (`bg-red-100`, `text-red-600`) | Click → filter to offline, pulse indicator if >0 |
| 4 | Active Tunnels | `3/10` | `PiLinkBold` | Orange (`bg-orange-100`, `text-orange-600`) | Progress bar style, warning at 8+ |

**Responsive grid:**
- Desktop (xl+): 4 columns
- Tablet/Mobile (md): 2x2 grid

## Section 2: Filter System

**Desktop/Tablet:** Collapsible filter bar

```
┌─────────────────────────────────────────────────────────────────┐
│ [🔍 Search by SN, name, IP...]  [Filters ▾]  [↻ Refresh] [⬇ CSV] │
└─────────────────────────────────────────────────────────────────┘

When "Filters" expanded:
┌─────────────────────────────────────────────────────────────────┐
│ Status: [All ▾]   Group: [All ▾]   Model: [All ▾]   [Clear All] │
└─────────────────────────────────────────────────────────────────┘
```

**Active filter chips:** Appear below search bar when filters applied
```
[Status: Offline ✕] [Group: Floor 3 ✕]
```

**Mobile:**
- Search stays visible inline
- "Filters" button opens bottom sheet with full filter options
- Active filters shown as chips

**Stale data warning:** Yellow banner above filters when data > 15 mins old (unchanged from current)

## Section 3: Device List

### Desktop Table

| Status | Device | Model | Group | IP | Clients | Synced | Actions |
|--------|--------|-------|-------|-----|---------|--------|---------|
| 🟢 | CT-AP-JHB-001 `MOCK` | EG105G-V2 | Floor 3 | 10.0.1.15 | 12 | 2m ago | [⋮] |
| 🔴 | CT-AP-CPT-002 | EG105G-V2 | Lobby | 10.0.1.16 | 0 | 5m ago | [⋮] |

**Changes from current:**
- Status column: Larger colored dot only (no text label)
- Offline rows: Subtle red background tint (`bg-red-50/50`)
- SN: Moved to expandable row detail (reduces clutter)
- Actions: Single `⋮` dropdown menu instead of 4 icons

**Actions dropdown menu:**
```
┌──────────────────┐
│ 👁 View Details  │
│ 🔗 Launch eWeb   │
│ ─────────────────│
│ 📋 Copy SN       │
│ 🔄 Reboot        │ ← Red text, disabled if offline
└──────────────────┘
```

### Mobile Card View

```
┌────────────────────────────────┐
│ 🟢 CT-AP-JHB-001          [⋮] │
│ EG105G-V2 • Floor 3           │
│ 12 clients • Synced 2m ago    │
└────────────────────────────────┘

┌────────────────────────────────┐
│ 🔴 CT-AP-CPT-002          [⋮] │  ← Red tint background
│ EG105G-V2 • Lobby             │
│ 0 clients • Synced 5m ago     │
└────────────────────────────────┘
```

## Section 4: Actions & Interactions

| Action | Trigger | Behavior |
|--------|---------|----------|
| Filter by status | Click Online/Offline StatCard | Sets status filter, scrolls to table |
| Refresh sync | Click Refresh button | Triggers Inngest sync, shows spinner, auto-refreshes data after 2s |
| Export CSV | Click Export button | Downloads filtered results |
| View details | Click row or "View Details" menu | Navigate to `/admin/network/devices/[sn]` |
| Launch eWeb | Menu item | Opens tunnel URL in new tab (creates tunnel if needed) |
| Copy SN | Menu item | Copies to clipboard, shows toast "SN copied" |
| Reboot | Menu item (red) | Opens confirmation dialog |

**Auto-refresh:** Every 30 seconds (unchanged)

**Tunnel limit warning:**
- At 8+/10: Tunnels StatCard shows orange warning
- At 10/10: "Launch eWeb" disabled with tooltip "Tunnel limit reached"

## Section 5: Loading & Error States

| State | Display |
|-------|---------|
| Initial load | Skeleton cards (4) + skeleton table rows (5) |
| Refreshing | Subtle overlay on table, Refresh button shows spinner |
| Empty (no devices) | Illustration + "No devices found" + "Trigger sync" CTA |
| Empty (filtered) | "No devices match filters" + [Clear Filters] button |
| Error | Red alert banner with retry button, preserves last good data |
| Stale data | Yellow warning bar (>15 mins) |

**Mock data indicator:** When all devices have `mock_data: true`:
```
┌─────────────────────────────────────────────────────────────┐
│ 🟣 Displaying mock data — Connect Ruijie API for live data  │
└─────────────────────────────────────────────────────────────┘
```

## Components to Create/Modify

| Component | Action | Location |
|-----------|--------|----------|
| `DeviceStatCards` | Create | `components/admin/network/DeviceStatCards.tsx` |
| `DeviceFilters` | Create | `components/admin/network/DeviceFilters.tsx` |
| `DeviceTable` | Create | `components/admin/network/DeviceTable.tsx` |
| `DeviceCard` | Create | `components/admin/network/DeviceCard.tsx` (mobile) |
| `DeviceActionsMenu` | Create | `components/admin/network/DeviceActionsMenu.tsx` |
| `page.tsx` | Modify | `app/admin/network/devices/page.tsx` |

## Files Affected

- `app/admin/network/devices/page.tsx` — Main page (refactor to use new components)
- `components/admin/network/` — New directory with 5 components
- Uses existing: `StatCard`, `Card`, `Table`, `DropdownMenu`, `Sheet` (for mobile filters)
