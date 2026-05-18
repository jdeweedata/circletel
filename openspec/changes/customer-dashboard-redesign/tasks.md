## 1. Refactor QuickActionCards to six-action launcher

- [x] 1.1 Update `quickActions` array in `components/dashboard/QuickActionCards.tsx`: remove "Place New Order" and "Manage Service", rename "View Invoices" to "Billing & statements" (href → `/dashboard/invoices`), rename "Payment Method" to "Payment details", add "Pay now" as first item (href → `/dashboard/billing`)
- [x] 1.2 Add optional `billingHighlight` prop (`{ amountDue: number; overdueCount: number }`) to `QuickActionCards` — when `amountDue > 0` or `overdueCount > 0`, render an orange badge on the "Pay now" card with the amount or overdue count
- [x] 1.3 Update grid classes from `lg:grid-cols-6` (7 items) to a clean 6-column layout: `grid-cols-2 md:grid-cols-3 lg:grid-cols-6`
- [x] 1.4 Increase card size for launcher prominence: bump icon container to `h-12 w-12`, icon to `h-6 w-6`, and add more vertical padding

## 2. Create ServiceSummaryStrip component

- [x] 2.1 Create `components/dashboard/ServiceSummaryStrip.tsx` — a horizontal card showing: package name, green status dot + "Active", download/upload speeds inline, monthly price, billing status line (balance + next billing date)
- [x] 2.2 Handle multi-service case: when `services.length > 1`, show "+{N} more" link to `/dashboard/services`
- [x] 2.3 Handle empty state: when `services.length === 0`, show "No active services" with a "Check Coverage & Order" link

## 3. Restructure dashboard page layout

- [x] 3.1 In `app/dashboard/page.tsx` `DashboardContent`, reorder sections: (1) OnboardingBanner, (2) welcome header, (3) pending-orders alert, (4) ConnectionStatusWidget, (5) QuickActionCards launcher, (6) ServiceSummaryStrip, (7) stats grid under "Account Overview" heading, (8) recent orders
- [x] 3.2 Pass `billingHighlight` prop to `QuickActionCards` from `data.billing` and `data.stats`
- [x] 3.3 Remove the standalone "Billing Summary" card (the `data.billing` section in the 2-column layout)
- [x] 3.4 Remove the standalone "Your Service" card (replaced by ServiceSummaryStrip)
- [x] 3.5 Add "Account Overview" section heading above the stats grid

## 4. Verify

- [x] 4.1 Run `npm run type-check:memory` — zero new errors
- [x] 4.2 Load `/dashboard` in browser and verify: launcher is first interactive section, six actions visible, "Pay now" badge logic works with mock billing data
- [x] 4.3 Verify responsive layout: 2-col on mobile, 3-col on tablet, 6-col on desktop
- [x] 4.4 Verify service summary strip renders correctly for active-service and no-service states
- [x] 4.5 Verify no "Billing Summary" card or standalone "Your Service" card remains on the page
