## ADDED Requirements

### Requirement: Active site triggers pro-rata first invoice
The system SHALL generate a pro-rata invoice for the first partial month when a site transitions to `active` status.

#### Scenario: Site activated mid-month
- **WHEN** a site status changes to `active` on day N of a month with D total days
- **THEN** the system SHALL generate an invoice with amount = (monthly_fee / D) * (D - N + 1), rounded to 2 decimal places

#### Scenario: Site activated on the 1st
- **WHEN** a site status changes to `active` on the 1st of the month
- **THEN** the system SHALL generate a full-month invoice (no pro-rata needed)

#### Scenario: Site activated on the last day
- **WHEN** a site status changes to `active` on the last day of the month
- **THEN** the system SHALL generate an invoice for 1 day: monthly_fee / days_in_month

### Requirement: First invoice generated via Inngest event
The system SHALL use an Inngest function triggered by the `b2b/site.activated` event to generate the first invoice.

#### Scenario: Inngest event payload
- **WHEN** a site is marked as `active` by admin
- **THEN** the system SHALL send an Inngest event `b2b/site.activated` with data: { site_id, organisation_id, activated_at, activated_by, package_id, monthly_fee }

#### Scenario: Inngest function creates invoice
- **WHEN** the `b2b/site.activated` event is received
- **THEN** the Inngest function SHALL: calculate pro-rata amount, insert a row into `customer_invoices` with correct line items, and log the invoice creation

#### Scenario: Duplicate activation prevention
- **WHEN** a `b2b/site.activated` event is received for a site that already has an invoice for the current month
- **THEN** the function SHALL skip invoice creation and log a warning

### Requirement: Subsequent months use existing invoice generation
The existing monthly invoice generation (25th of each month via Inngest) SHALL automatically include newly activated sites.

#### Scenario: Active site included in next monthly run
- **WHEN** the monthly invoice generation runs on the 25th
- **THEN** all sites with status `active` and a valid `package_id` SHALL have invoices generated at their `monthly_fee` rate

#### Scenario: Suspended site excluded
- **WHEN** a site has status `suspended` at the time of monthly invoice generation
- **THEN** the system SHALL NOT generate an invoice for that site
