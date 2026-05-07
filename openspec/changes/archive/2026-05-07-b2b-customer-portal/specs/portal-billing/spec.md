## ADDED Requirements

### Requirement: Consolidated invoice list
The system SHALL provide a `/portal/billing` page showing invoices for the portal user's organisation, with per-site line item visibility.

#### Scenario: Admin views invoice list
- **WHEN** an admin portal user navigates to `/portal/billing`
- **THEN** the page displays a list of invoices for their organisation sorted by date descending, showing invoice number, period, total amount, payment status, and due date

#### Scenario: Site user views invoice list
- **WHEN** a site_user navigates to `/portal/billing`
- **THEN** the page displays the same organisation invoices (billing is consolidated at org level, not per-site)

#### Scenario: Invoice detail shows line items
- **WHEN** a portal user clicks on an invoice
- **THEN** the system shows invoice line items broken down by site (site name, service description, amount per site)

### Requirement: Invoice PDF download
The system SHALL allow portal users to download invoice PDFs.

#### Scenario: Download invoice
- **WHEN** a portal user clicks "Download" on an invoice
- **THEN** the system returns the invoice PDF via `/api/portal/billing/[id]/download`

### Requirement: Payment status visibility
The system SHALL show current payment status on invoices (paid, pending, overdue).

#### Scenario: Overdue invoice highlighted
- **WHEN** an invoice's due date has passed and status is not "paid"
- **THEN** the invoice is displayed with an "Overdue" badge and visual emphasis
