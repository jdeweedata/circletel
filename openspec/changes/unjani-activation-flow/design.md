## Context

The B2B customer portal is complete (44/44 tasks). Portal users can log in, view sites, view billing, and submit support tickets. The Unjani managed connectivity product (UNJ-MC-001, R450/month excl. VAT) exists in `service_packages`. The `corporate_sites` table already has status (enum: pending→active→decommissioned), technology, package_id, monthly_fee, and device columns.

What's missing: no way for portal users to request site activation, no admin UI to process activations, no audit trail for status changes, and no automated first-invoice generation on activation.

Key constraint: the existing support ticket system (`b2b_support_tickets` + `/portal/support` page) is the agreed entry point for activation requests — this is an activation request, not an order.

## Goals / Non-Goals

**Goals:**
- Portal users can submit structured activation requests through the existing support page
- Admin staff can view sites per account, activate sites (assign technology + package), and transition status with full audit trail
- First pro-rata invoice auto-generates when a site reaches `active` status
- All site status changes are audited with who/when/why

**Non-Goals:**
- Splitting the `lte_5g` technology enum into separate `lte` and `5g` values (deferred — requires migration of existing rows)
- Portal users viewing activation request progress beyond ticket status (open/resolved)
- Bulk activation UI (single-site activation only in v1; bulk can be added later)
- Wholesale order placement to Arlan/MTN (manual process, just store the reference)
- Self-service activation (portal users request, admin processes)

## Decisions

### D1: Ticket type as enum column on existing table

Add a `support_ticket_type` enum and `ticket_type` column to `b2b_support_tickets` rather than creating a separate activation_requests table.

**Why**: Activation requests share the same lifecycle (open→resolved), same notification flow (Resend email), and same portal UI location. A separate table would duplicate the ticket infrastructure. The `ticket_type` column lets us filter and route differently while reusing everything.

**Alternative considered**: Separate `b2b_activation_requests` table. Rejected because it duplicates the notification, status tracking, and history UI. The structured data (site_id, preferred_date) already fits in the existing columns (site_id exists, preferred_date goes in description or a metadata JSONB).

### D2: Activation request metadata in auto-generated description

Store the structured activation data (preferred date, notes) in the auto-generated `description` text rather than adding new columns.

**Why**: Avoids schema changes beyond the ticket_type column. The description is human-readable and included in the email notification. Admin doesn't need to query activation requests by preferred_date — they see the ticket and process it.

**Alternative considered**: Add `metadata jsonb` column to support tickets. Viable but unnecessary for v1 — the description captures everything needed.

### D3: Admin activation via PATCH on site-details endpoint

Add a status update capability to the existing admin site-details API (`/api/admin/b2b-customers/site-details/[siteId]`) rather than creating a new endpoint.

**Why**: The site-details route already exists and handles site queries. Adding PATCH for status transitions is a natural extension. The endpoint uses service role (bypasses RLS), which is correct for admin operations.

**API shape**:
```
PATCH /api/admin/b2b-customers/site-details/[siteId]/activate
Body: { status, technology, package_id, monthly_fee, wholesale_order_ref?, installed_at?, installed_by?, notes? }
```

A dedicated `/activate` sub-route is clearer than overloading PATCH on the base route, and it can enforce the state machine validation.

### D4: State machine enforced server-side only

Valid transitions are enforced in the API route, not in the database (no triggers or constraints).

**Why**: The transition rules are business logic that may evolve. Keeping them in TypeScript makes them testable and visible. The audit table provides the safety net for tracking what happened.

**Valid transitions**:
```
pending → ready | provisioned
ready → provisioned
provisioned → active
active → suspended | decommissioned
suspended → active
```

### D5: Inngest event for first invoice, not synchronous

The `b2b/site.activated` Inngest event triggers async invoice generation rather than creating the invoice inline in the activation API.

**Why**: Invoice generation involves pro-rata calculation, customer_invoices insert, and potentially future extensions (email notification, PDF generation). Keeping it async follows the existing Inngest pattern used for monthly invoice generation and avoids blocking the admin activation response.

### D6: corporate_site_events as flat audit table

A simple append-only table with jsonb old_value/new_value rather than a structured event sourcing pattern.

**Why**: We need an audit trail, not event sourcing. The jsonb columns are flexible enough to capture any field change without schema migrations per event type. The table is append-only — no updates or deletes in application code.

## Risks / Trade-offs

**[Risk] Duplicate activation requests** → The portal doesn't prevent submitting multiple activation requests for the same site. Mitigation: admin sees all tickets and can resolve duplicates. V2 could check for existing open activation tickets for the same site.

**[Risk] 5G negative margin not surfaced** → The `lte_5g` combined enum means admin won't see that a 5G site costs R503 wholesale vs R450 revenue. Mitigation: deferred to enum split work. For now, admin staff know the cost structure from the financial model.

**[Risk] Pro-rata calculation edge cases** → Timezone handling for activation date. Mitigation: use `installed_at` timestamp in SAST (Africa/Johannesburg), calculate days remaining in the month server-side.

**[Risk] Inngest event lost** → If the Inngest event fails to send, no invoice is created. Mitigation: Inngest has built-in retries (3 attempts). The monthly invoice run on the 25th will catch any site that's active but has no invoice for the current month.

**[Trade-off] No bulk activation in v1** → Admin must activate sites one at a time. Acceptable for 28 Phase 2 sites (takes ~15 minutes). Bulk activation can be added as a follow-up.

## Migration Plan

1. Run migration: add `support_ticket_type` enum, add `ticket_type` column with default `'support'`, add `wholesale_order_ref` column, create `corporate_site_events` table
2. Deploy code changes (portal support form + admin sites section + activation API + Inngest function)
3. No data migration needed — existing tickets get `ticket_type = 'support'` via default
4. Rollback: revert code, column is additive and doesn't break existing queries
