## ADDED Requirements

### Requirement: Action launcher is the primary dashboard element
The dashboard page SHALL render the action launcher grid immediately after the welcome header and any system banners (OnboardingBanner, pending-orders alert), before stats cards, service details, or order history.

#### Scenario: Default page load
- **WHEN** a customer loads `/dashboard` with a valid session
- **THEN** the action launcher grid is the first interactive section visible below the header and banners

#### Scenario: Mobile viewport
- **WHEN** the viewport width is below 768px
- **THEN** the action launcher renders as a 2-column grid

#### Scenario: Desktop viewport
- **WHEN** the viewport width is 1024px or above
- **THEN** the action launcher renders as a 6-column single-row grid

### Requirement: Action launcher defines six customer actions
The launcher SHALL display exactly six action cards in this order: Pay now, Billing & statements, Payment details, My profile, Log a ticket, Get help.

#### Scenario: All six actions are visible
- **WHEN** the dashboard loads
- **THEN** six action cards are rendered with the titles "Pay now", "Billing & statements", "Payment details", "My profile", "Log a ticket", "Get help"

#### Scenario: Each action links to its destination
- **WHEN** a customer clicks "Pay now"
- **THEN** they navigate to `/dashboard/billing`
- **WHEN** a customer clicks "Billing & statements"
- **THEN** they navigate to `/dashboard/invoices`
- **WHEN** a customer clicks "Payment details"
- **THEN** they navigate to `/dashboard/payment-method`
- **WHEN** a customer clicks "My profile"
- **THEN** they navigate to `/dashboard/profile`
- **WHEN** a customer clicks "Log a ticket"
- **THEN** they navigate to `/dashboard/tickets`
- **WHEN** a customer clicks "Get help"
- **THEN** they navigate to `/dashboard/support`

### Requirement: Pay now action highlights when balance is due
The "Pay now" action card SHALL display an attention state when the customer has an outstanding balance or overdue invoices.

#### Scenario: Outstanding balance exists
- **WHEN** `billing.account_balance > 0`
- **THEN** the "Pay now" card displays an orange badge showing the amount due formatted as "R{amount}"
- **AND** the card border uses the `circleTel-orange` accent colour

#### Scenario: Overdue invoices exist without balance
- **WHEN** `stats.overdueInvoices > 0` and `billing.account_balance === 0`
- **THEN** the "Pay now" card displays a badge showing "{count} overdue"
- **AND** the card border uses the `circleTel-orange` accent colour

#### Scenario: No outstanding balance
- **WHEN** `billing.account_balance === 0` and `stats.overdueInvoices === 0`
- **THEN** the "Pay now" card renders in the default style with no badge or accent border

### Requirement: Service summary strip shows primary service at a glance
The dashboard SHALL render a compact horizontal service summary strip below the action launcher, showing the primary service's package name, download/upload speeds, status, monthly price, and billing status.

#### Scenario: Customer has an active service
- **WHEN** `services.length > 0` and the first service has `status === 'active'`
- **THEN** the strip displays: package name, a green status dot with "Active", download speed, upload speed, monthly price, and a billing status line (balance due + next billing date)

#### Scenario: Customer has multiple services
- **WHEN** `services.length > 1`
- **THEN** the strip shows the primary service and a "+{N} more" indicator linking to `/dashboard/services`

#### Scenario: Customer has no active services
- **WHEN** `services.length === 0`
- **THEN** the strip displays an empty state with "No active services" and a "Check Coverage & Order" link to `/`

### Requirement: Stats grid renders below the fold as Account Overview
The existing 4-stat grid (active services, total orders, account balance, billing status) SHALL render below the service summary strip under an "Account Overview" heading.

#### Scenario: Stats section position
- **WHEN** the dashboard loads
- **THEN** the stats grid appears after the action launcher and service summary strip
- **AND** the section has the heading "Account Overview"

### Requirement: Billing summary card is removed
The standalone "Billing Summary" card that previously appeared in the 2-column layout SHALL NOT render. Billing information is consolidated into the service summary strip and the "Pay now" / "Billing & statements" launcher actions.

#### Scenario: No duplicate billing card
- **WHEN** the dashboard loads
- **THEN** there is no card with the heading "Billing Summary" on the page

### Requirement: Place New Order and Manage Service actions are removed from the launcher
The "Place New Order" and "Manage Service" quick actions SHALL be removed from the primary launcher. Service management is accessible via the service summary strip's "View all" link and the services page.

#### Scenario: Launcher does not include order or service management
- **WHEN** the dashboard loads
- **THEN** no action card with the title "Place New Order" or "Manage Service" appears in the launcher grid
