# CircleTel Dashboard — SuperSonic-Inspired Redesign

**Date**: 2026-04-03
**Status**: Approved for implementation
**Scope**: Customer-facing dashboard (`/dashboard` and all sub-pages)

---

## Context

SuperSonic (supersonic.co.za) is a direct competitor ISP in South Africa. Their customer portal was researched on 2026-04-03. Key elements worth adopting:

- Clean flat-card navigation (no sidebar)
- Async service loading with progress bar
- 2-panel ticket conversation view (Gmail-style)
- Invoice history table with status badges

CircleTel keeps its differentiators: Network Health, Speed Test, PPPoE credentials, Usage monitoring, Upgrade/Downgrade/Relocate service management, and Onboarding banner.

---

## Decisions Made

| Element | Decision |
|---------|----------|
| Layout | Flat (no sidebar) — top nav + card grid |
| Action cards | 8 cards in 4×2 grid |
| Ticket page | 2-panel conversation view |
| Invoice table | 6-column enriched with type + status badges |
| Service card | Rich card with Network Health + Speed Test |

---

## 1. Global Layout

### Remove Sidebar
- `DashboardLayout` (`app/dashboard/layout.tsx`) loses the `DashboardSidebar` and `MobileBottomNav`.
- Replace with a **sticky top nav** only.

### Top Nav
```
[CircleTel logo] [Home · Products · Deals · Support] [JD avatar dropdown]
```
- **Avatar dropdown**: Dashboard · My Profile · Billing · Logout (matches current `DashboardHeader` menu items)
- Sticky (`position: sticky; top: 0; z-index: 10`)
- White background, `border-bottom: 1px solid #e2e8f0`
- Logo: orange `#F5831F` wordmark with dot
- **Mobile** (`< 768px`): nav links hidden, avatar remains visible; hamburger icon opens a slide-down drawer with the same links. Drawer closes on route change.

### Page Container
- `max-width: 900px`, `margin: 0 auto`, `padding: 28px 20px`
- Background: `#f1f5f9`

---

## 2. Dashboard Home (`/dashboard`)

### Welcome Header
```
Hi, {first_name} {last_name} 👋
#{account_number} · Welcome to your CircleTel account.
```

### Onboarding Banner (conditional)
- Shown when `onboarding.complete === false` (existing `OnboardingBanner` component)
- Gradient background: `linear-gradient(135deg, #fff7ed, #fef3c7)`, amber border
- Shows step label + progress bar (percentage)
- Collapsed/dismissed state persisted to localStorage (existing behaviour)

### Stats Row (4 chips)
| Chip | Value | Source | Clickable |
|------|-------|--------|-----------|
| Services | count of active services | `summary.services.length` | No |
| Orders | count | `summary.orders.total` | Yes → `/dashboard/orders` |
| Tickets | open count | `summary.tickets.open` | No |
| Balance Due | `R{amount}` green if 0, red if >0 | `summary.billing.account_balance` | Yes → `/dashboard/billing` |

**Note**: `account_balance` already exists in `/api/dashboard/summary` response (`billing.account_balance`). No API change needed for this chip.

### My Account Section Label
`MY ACCOUNT` — uppercase, `#94a3b8`, `font-size: 11px`

### 4×2 Action Card Grid
8 cards in order (left→right, top→bottom):

| # | Label | Icon | Destination | Style |
|---|-------|------|-------------|-------|
| 1 | Pay Now | 💳 | `/dashboard/billing` | **Primary** (orange label) |
| 2 | Invoices & Statements | 📑 | `/dashboard/invoices` | Default |
| 3 | Update Banking | 🏦 | `/dashboard/payment-method` | Default |
| 4 | My Profile | 👤 | `/dashboard/profile` | Default |
| 5 | Log a Ticket | 🎫 | `/dashboard/tickets` | Default |
| 6 | Get Help | ❓ | `/dashboard/support` | Default |
| 7 | Check Usage | 📊 | `/dashboard/usage` | Default |
| 8 | Upgrade Plan | ⬆️ | `/dashboard/services/upgrade` | Default |

**Card anatomy**: white bg, `border: 1px solid #e2e8f0`, `border-radius: 12px`, centered icon (22px) + label (12px bold). On hover: `border-color: #F5831F`, subtle orange box-shadow.

Replace existing `QuickActionCards.tsx` component with this new 4×2 grid. Reuse `SharedQuickActionCard.tsx` pattern.

---

## 3. My Connectivity Section

### Section Header
`MY CONNECTIVITY` label + `Add Product` button (right-aligned, existing behaviour).

### Async Loading State
While services are fetching (before API response):
- Show animated shimmer progress bar (3px height, orange gradient, CSS animation)
- Show `"Fetching your service details…"` text below bar
- Same pattern as SuperSonic's `"Fetching your services"` loader
- Implemented in `ConnectionStatusWidget.tsx` or directly in `page.tsx`

### Service Card (per active service)
Each service renders one card. Fields:

| Element | Source | Notes |
|---------|--------|-------|
| Status dot + label | `service.status` | Green dot = "Connected & Billing" |
| Service name | `service.package_name` | e.g. "SkyFibre SMB 100/100 Mbps" |
| Address | `service.address` formatted | Short form: unit + suburb + postal |
| **Manage ▾** button | → `ServiceManageDropdown.tsx` | Orange button, top-right |
| Download speed | `service.download_speed` | Green box |
| Upload speed | `service.upload_speed` | Blue box |
| Network Health | `ConnectionStatusWidget` | "Excellent · 99.9% uptime" with green dot |
| Speed Test | button | Opens existing speed test flow |
| PPPoE credentials | button | Opens `PPPoECredentialsCard.tsx` |
| Monthly fee | `service.monthly_price` | incl VAT label (field confirmed in summary API) |
| Next billing date | `billing.next_billing_date` | From billing API |

**Service card uses existing components**: `ServiceManageDropdown.tsx`, `ConnectionStatusWidget.tsx`, `PPPoECredentialsCard.tsx` — no rewrites, just re-layout into the new card shell.

### Manage Dropdown Actions (unchanged)
Upgrade Plan · Downgrade Plan · Relocate Service · Pause Service

### Empty State (no services)
`"No active services"` + `"Check coverage"` CTA button (existing pattern).

---

## 4. Invoices Page (`/dashboard/invoices`)

### Layout
- `"Go back to dashboard"` back-link (replaces sidebar nav)
- `"Billing and statements"` heading
- 3 tabs: **Billing** | **Statements** | **Invoices** (existing tab structure, keep)

### Invoices Tab — 6-Column Table

| Column | Source | Notes |
|--------|--------|-------|
| Invoice # | `invoice.invoice_number` | Blue link colour |
| Date | `invoice.invoice_date` | `"Apr 2026"` format |
| Type | `invoice.invoice_type` | Badge: Recurring (blue) / Install (green) / Pro-rata (purple) / Equipment (amber) / Adjustment (grey) |
| Amount | `invoice.total_amount` | Bold, `Intl.NumberFormat('en-ZA')` |
| Status | `invoice.status` | Badge: Paid (green) / Unpaid (yellow) / Overdue (red) / Draft (grey) |
| Actions | conditional | "Pay Now" (orange) if unpaid/overdue; "View PDF" (grey) if paid |

**Status badge colours:**
```
paid     → bg: #dcfce7  text: #16a34a
unpaid   → bg: #fef9c3  text: #ca8a04
overdue  → bg: #fee2e2  text: #dc2626
draft    → bg: #f1f5f9  text: #64748b
```

**Type badge colours:**
```
recurring  → bg: #eff6ff  text: #3b82f6
installation → bg: #f0fdf4  text: #16a34a
pro_rata   → bg: #faf5ff  text: #7c3aed
equipment  → bg: #fff7ed  text: #f97316
adjustment → bg: #f1f5f9  text: #64748b
```

Replaces the existing `invoices/page.tsx` table. Reuse existing `InvoiceListItem` data fetching from `/api/dashboard/invoices`.

---

## 5. Tickets Page (`/dashboard/tickets`)

### Layout: 2-Panel Conversation View

```
┌─────────────────────┬─────────────────────────────────────┐
│  My Requests   [+New]│  SST641200 — Billing question       │
│─────────────────────│  Billing · Opened Mar 2 · Open       │
│ ▶ Billing question  │─────────────────────────────────────│
│   Mar 2 · [Open]    │  [CT] CircleTel Support              │
│   Internet is down  │       "Hi Jeffrey, I can see…"       │
│   May 14 · [Closed] │       09:14                         │
│   Speed issue       │  [JD] You                            │
│   Jan 10 · [Closed] │       "Thank you, makes sense!"      │
│                     │       09:22                         │
│                     │─────────────────────────────────────│
│                     │  [Reply to this ticket…]    [Send]   │
└─────────────────────┴─────────────────────────────────────┘
```

### Left Panel
- Fixed width: `240px`
- Header: "My Requests" + `"+ New"` orange button
- Ticket items: subject (truncated), date, status badge
- Active ticket: `border-left: 3px solid #F5831F`, `background: #fff7ed`
- Clicking a ticket loads conversation in right panel (client-side state, no navigation)

### Right Panel
- Header: ticket subject, category, date, status
- Messages: alternating agent (left, dark avatar) vs customer (right, orange avatar)
- Agent bubble: `bg: #f1f5f9` (grey), `border-radius: 4px 12px 12px 12px`
- Customer bubble: `bg: #fff7ed` (orange-tinted), `border-radius: 12px 4px 12px 12px`
- Reply input + Send button pinned to bottom
- "Select a conversation" placeholder when none selected

### Data
- Existing Zoho Desk integration: `GET /api/support/tickets/list` returns `ZohoDeskTicket[]`
- Comments: fetched on-demand when a ticket is selected — call `GET /api/support/tickets/list?email={email}` and use the `comments` field on the matching ticket, or add a `GET /api/support/tickets/[id]/comments` endpoint if comments are paginated separately in Zoho Desk
- New ticket: existing `POST /api/support/tickets/create` flow

**Replaces** the current simple list in `tickets/page.tsx`. The `support/page.tsx` FAQ + contact form page is unchanged.

---

## 6. Back Navigation

All sub-pages replace sidebar navigation with a `"← Back to dashboard"` text link at the top of the page, identical to SuperSonic's pattern. Implemented as a shared `DashboardBackLink` component.

---

## 7. Files to Create / Modify

### Modified
| File | Change |
|------|--------|
| `app/dashboard/layout.tsx` | Remove sidebar, remove MobileBottomNav, add sticky TopNav |
| `app/dashboard/page.tsx` | Rewrite to flat layout: stats row, 4×2 cards, service card, async loader |
| `app/dashboard/invoices/page.tsx` | Replace table with 6-column enriched table + type/status badges |
| `app/dashboard/tickets/page.tsx` | Replace list with 2-panel conversation view |
| `app/api/dashboard/summary/route.ts` | Already has `billing.account_balance` and `billing.next_billing_date` — no change needed |

### New Components
| File | Purpose |
|------|---------|
| `components/dashboard/DashboardTopNav.tsx` | Sticky top nav with logo, links, avatar dropdown |
| `components/dashboard/DashboardBackLink.tsx` | Shared `← Back to dashboard` link |
| `components/dashboard/AccountStatsRow.tsx` | 4-chip stats row |
| `components/dashboard/QuickActionGrid.tsx` | 4×2 action card grid (replaces QuickActionCards.tsx) |
| `components/dashboard/ServiceCard.tsx` | Rich service card shell (wraps existing sub-components) |
| `components/dashboard/TicketConversationPanel.tsx` | 2-panel ticket UI |
| `components/dashboard/InvoiceTable.tsx` | 6-column invoice table with badges |

### Unchanged (reused as-is)
- `ConnectionStatusWidget.tsx`
- `ServiceManageDropdown.tsx`
- `PPPoECredentialsCard.tsx`
- `OnboardingBanner.tsx`
- `components/dashboard/navigation/DashboardNavContext.tsx`
- All API routes except `summary/route.ts`
- All other dashboard pages (billing, profile, orders, usage, services, compliance, kyc)

---

## 8. Styling

- Brand orange: `#F5831F` (existing Tailwind `orange-500` / custom `circletel-orange`)
- All new components use Tailwind classes consistent with existing dashboard
- Status badge colours implemented as Tailwind utility classes via `cn()` helper
- No new dependencies required

---

## 9. Verification

### Manual testing checklist
1. Dashboard loads — no sidebar visible on desktop or mobile
2. Stats row shows correct counts from `/api/dashboard/summary`
3. "Balance Due" chip shows red when invoice is unpaid, green when R0
4. All 8 action cards navigate to correct routes
5. Service card shows async loading bar before data arrives
6. Service card shows speeds, health, speed test, PPPoE, monthly fee, next billing
7. Manage dropdown shows Upgrade / Downgrade / Relocate / Pause
8. Invoice table shows type badge and status badge for each row
9. "Pay Now" action link appears for unpaid/overdue invoices
10. Ticket list shows all tickets; clicking one loads conversation in right panel
11. "+ New" ticket button opens create-ticket form
12. Reply input sends message via existing Zoho API
13. "← Back to dashboard" link appears on all sub-pages
14. Onboarding banner only shown when `onboarding.complete === false`
15. Mobile: top nav collapses gracefully, cards stack to 2×4 on small screens

### Type check
```bash
npm run type-check:memory
```

### Build
```bash
npm run build:memory
```
