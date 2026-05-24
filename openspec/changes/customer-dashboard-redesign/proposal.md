## Why

The consumer dashboard (`/dashboard`) currently loads a dense page with 4 stat cards, a quick-actions grid, a service card, a billing card, and a recent-orders table — all at once. Customers who log in to perform a single task (pay a bill, check a statement, update payment details) must scan past unrelated sections to find their action. Competitor dashboards (SuperSonic, Afrihost) lead with a clear action launcher and a compact service summary, reducing time-to-task. Reorganising the dashboard around the six most common customer actions and a glanceable service summary will cut friction for returning customers and align with the patterns benchmarked in Plan 1.

## What Changes

- **Promote the action launcher to primary UI element.** Restructure the page so the six-action grid (Pay now, Billing & statements, Payment details, My profile, Log a ticket, Get help) sits immediately below the welcome header — before any stats or data cards. The existing `QuickActionCards` component will be refactored to become this launcher with visual priority (larger cards, prominent icons, "Pay now" highlighted when a balance is due).
- **Add a compact service summary strip.** Replace the current full-width "Your Service" card with a slim, horizontally-oriented service summary showing package name, speed, status dot, and monthly price — enough context at a glance without dominating the page.
- **Consolidate billing entry points.** The current dashboard shows an "Account Balance" stat card, a "Billing Status" stat card, and a "Billing Summary" section card that all link to `/dashboard/billing`. These will be merged into a single billing status row within the service summary, reducing visual noise.
- **Relocate stats grid below the fold.** Move the 4-stat grid (active services, total orders, account balance, billing status) below the action launcher and service summary. It becomes a supporting "Account Overview" section rather than the first thing a customer sees.
- **Conditionally highlight "Pay now".** When `billing.account_balance > 0` or `stats.overdueInvoices > 0`, the "Pay now" action card gets an attention state (orange badge with amount due) so customers with outstanding balances see the most important action immediately.
- **Preserve existing sub-pages.** No changes to `/dashboard/billing`, `/dashboard/invoices`, `/dashboard/profile`, `/dashboard/services`, `/dashboard/tickets`, `/dashboard/support`, `/dashboard/payment-method`, or their API routes. This redesign is scoped to the main `/dashboard/page.tsx` and its direct component imports.

## Capabilities

### New Capabilities

- `consumer-dashboard-launcher`: The six-action launcher grid that becomes the primary navigation element on the consumer dashboard. Covers action definitions, layout hierarchy, conditional highlighting logic, and responsive behaviour.

### Modified Capabilities

(none — the existing `portal-dashboard` and `portal-billing` specs are for the B2B portal at `/portal`, not the consumer dashboard at `/dashboard`)

## Impact

- **Files modified**: `app/dashboard/page.tsx`, `components/dashboard/QuickActionCards.tsx`
- **Files potentially new**: `components/dashboard/ServiceSummaryStrip.tsx` (compact service summary)
- **No API changes**: All data already provided by `/api/dashboard/summary`
- **No database changes**: Existing `DashboardData` interface supplies all required fields
- **No sub-page changes**: Only the main dashboard page layout is affected
- **Risk**: Low — purely presentational restructuring of an existing page with existing data
