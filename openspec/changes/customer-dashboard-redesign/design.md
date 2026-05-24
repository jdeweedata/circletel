## Context

The consumer dashboard at `/dashboard/page.tsx` currently renders five sections in a fixed vertical stack: welcome header, pending-orders alert, connection status widget, 4-column stats grid, quick-action cards, and a 2-column service/billing layout with recent orders. All data comes from a single API call to `/api/dashboard/summary` which returns a `DashboardData` object containing customer info, services, billing, orders, invoices, and computed stats.

The existing `QuickActionCards` component already defines the seven actions we want (Place New Order, Payment Method, View Invoices, Manage Service, My Profile, Log a Ticket, Get Help). The redesign promotes this launcher to the primary UI element and introduces a compact service summary, without changing the API or data model.

**Constraints:**
- No API route changes — all data is already in `DashboardData`
- No database schema changes
- No sub-page modifications (billing, invoices, profile, etc.)
- Must preserve the `OnboardingBanner`, `EmailVerificationModal`, and `ConnectionStatusWidget` behaviours
- Must work on mobile (2-col) through desktop (6-col)

## Goals / Non-Goals

**Goals:**
- Reduce time-to-task for the most common customer actions (pay, view billing, update payment method)
- Make the dashboard scannable in under 3 seconds — action launcher + service status at a glance
- Conditionally highlight "Pay now" when a balance is due, so customers with outstanding payments see the priority action immediately
- Consolidate the three billing-related stat/card elements into a single billing row within the service summary

**Non-Goals:**
- Redesigning sub-pages (`/dashboard/billing`, `/dashboard/profile`, etc.)
- Adding new API endpoints or modifying `/api/dashboard/summary`
- Changing the `CustomerAuthProvider` or auth flow
- Real-time data (WebSocket connection status updates) — the existing polling approach stays
- Mobile app or native components — this is web-only

## Decisions

### 1. Refactor `QuickActionCards` in place rather than creating a new component

**Rationale:** The component already defines the correct 7 actions with icons, colours, and links. Creating a parallel component would leave the old one orphaned. Instead, we update the existing component to support the new visual treatment (larger cards, conditional badge on "Pay now").

**Alternative considered:** New `DashboardLauncher` component — rejected because it duplicates the action definitions and creates a maintenance burden.

### 2. Accept an optional `billingHighlight` prop on `QuickActionCards` rather than fetching data internally

**Rationale:** The dashboard page already has the billing data from `DashboardData`. Passing a highlight prop (`{ amountDue: number; overdueCount: number }`) keeps the action cards a presentational component without its own data-fetching concerns.

**Alternative considered:** Having QuickActionCards call `/api/dashboard/summary` itself — rejected because it would duplicate the fetch already happening in the parent.

### 3. New `ServiceSummaryStrip` component as a separate file

**Rationale:** The current "Your Service" card is 70+ lines of JSX with speed display, status badges, and manage dropdown. A compact horizontal strip is a fundamentally different layout that doesn't share enough structure to justify conditional rendering within the same component. A new `components/dashboard/ServiceSummaryStrip.tsx` keeps both concerns clean.

**Alternative considered:** Adding a `compact` prop to the inline service card — rejected because the two layouts share almost no markup.

### 4. Keep stats grid but move it below the launcher

**Rationale:** The stats (active services, total orders, account balance, billing status) are still useful for customers who want a deeper view. Removing them would lose trend data. Moving them below the fold preserves the data while prioritising actions.

### 5. Remove the standalone "Billing Summary" card

**Rationale:** With billing status integrated into the service summary strip and "Pay now" highlighted in the launcher, the full billing card becomes redundant. The "View invoices" link moves to the launcher's "Billing & statements" action. Recent orders remain as the only below-the-fold detail card.

### 6. Rename "View Invoices" action to "Billing & statements"

**Rationale:** Aligns with competitor terminology (SuperSonic uses "Billing & statements") and covers both invoices and the statement page at `/dashboard/statement`, reducing the need for customers to distinguish between the two.

## Risks / Trade-offs

- **[Returning customers expect current layout]** → The new layout preserves all the same destinations — only their visual position changes. No functionality is removed. Mitigation: keep the same action titles and icons where possible.
- **[Service summary strip may feel too sparse for multi-service customers]** → The strip shows only the primary service. The "View all" link to `/dashboard/services` handles multi-service cases. Mitigation: show a "+N more services" indicator when `services.length > 1`.
- **[Removing billing card loses payment-method-at-a-glance]** → The "Payment details" action card links directly to `/dashboard/payment-method`. Mitigation: the service summary strip includes a one-line billing status (balance + next due date).
- **[Stats below fold may reduce visibility of overdue alerts]** → The "Pay now" conditional highlight in the launcher compensates. The pending-orders alert banner also remains above the fold.
