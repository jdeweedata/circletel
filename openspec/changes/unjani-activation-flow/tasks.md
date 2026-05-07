## 1. Database Migrations

- [x] 1.1 Create `support_ticket_type` enum (`support`, `fault_report`, `activation_request`, `change_request`) and add `ticket_type` column to `b2b_support_tickets` with default `'support'`
- [x] 1.2 Add `wholesale_order_ref text` column to `corporate_sites`
- [x] 1.3 Create `corporate_site_events` table (id uuid PK, site_id FK cascade, event_type text, old_value jsonb, new_value jsonb, performed_by uuid nullable, notes text nullable, created_at timestamptz default now())

## 2. Portal Support Form — Ticket Type

- [x] 2.1 Add ticket type selector UI to `/portal/support` page (radio group or select: Support Request, Fault Report, Activate Site, Change Request) with "Support Request" as default
- [x] 2.2 Implement conditional form rendering: standard form (subject, description, priority, site) for support/fault_report/change_request; structured form (site selector required, preferred date, notes) for activation_request
- [x] 2.3 Auto-generate subject and description for activation requests: subject = "Activate: {site_name}", description includes company, preferred date, and notes
- [x] 2.4 Add site status validation — only show sites with status `pending` or `ready` in the activation site selector
- [x] 2.5 Add ticket type badge to ticket history list items

## 3. Portal Support API — Ticket Type

- [x] 3.1 Update `POST /api/portal/support` to accept `ticket_type` field, validate against enum, default to `'support'`
- [x] 3.2 Add site status check for activation requests — return 400 if site is not in `pending` or `ready` status
- [x] 3.3 Update email notification subject line to "[Portal Activation]" prefix for activation_request type

## 4. Admin Sites Section on Account Detail

- [x] 4.1 Add Sites section to `/admin/b2b-customers/[id]` page — fetch and display all corporate_sites for the account with columns: site name, status badge, technology, monthly fee, actions
- [x] 4.2 Add status filter dropdown (all, pending, ready, provisioned, active, suspended) to the Sites section
- [x] 4.3 Add "Activate" button in actions column for sites with status `pending` or `ready`
- [x] 4.4 Add "Mark Active" button in actions column for sites with status `provisioned`

## 5. Admin Activate Site Dialog

- [x] 5.1 Create Activate Site dialog component with fields: technology selector (tarana_fwb, lte_5g, ftth, fwa), package (auto-selected UNJ-MC-001 for Unjani), install date (optional), installer name (optional), wholesale order reference (optional), notes (optional)
- [x] 5.2 Create Mark Active confirmation dialog — confirms setting status to `active` and setting `installed_at`

## 6. Admin Activation API

- [x] 6.1 Create `PATCH /api/admin/b2b-customers/site-details/[siteId]/activate` endpoint — validates state transition, updates corporate_sites (status, technology, package_id, monthly_fee, wholesale_order_ref, installed_at, installed_by), inserts corporate_site_events audit row
- [x] 6.2 Implement state machine validation: pending→ready|provisioned, ready→provisioned, provisioned→active, active→suspended|decommissioned, suspended→active
- [x] 6.3 On transition to `active`: send Inngest event `b2b/site.activated` with site_id, organisation_id, activated_at, activated_by, package_id, monthly_fee

## 7. Inngest Pro-Rata Invoice Function

- [x] 7.1 Create Inngest function `b2b-site-activation-invoice` triggered by `b2b/site.activated` event — calculates pro-rata amount for remaining days in month, inserts customer_invoices row
- [x] 7.2 Add duplicate prevention — check if invoice already exists for site+month before creating
- [x] 7.3 Add failure event handling — send `b2b/site.activation-invoice.failed` on error

## 8. Verification

- [x] 8.1 Type check passes (`npm run type-check:memory`)
- [ ] 8.2 Test portal activation request flow end-to-end: select ticket type, fill form, submit, verify ticket created with correct type and auto-generated subject
- [ ] 8.3 Test admin activation flow: view sites, click Activate, fill dialog, verify site status updated and audit event logged
- [ ] 8.4 Test state machine: verify invalid transitions return 400
