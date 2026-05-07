## Why

The B2B customer portal is complete (44/44 tasks) and the Unjani managed connectivity product (UNJ-MC-001) exists in the catalogue, but there is no way for portal users to request site activation or for admin staff to process those activations. The 22 active Unjani sites + 28 Phase 2 rollout sites need a structured activation workflow that moves sites from `pending` through to `active` status, triggers billing, and provides an audit trail. Without this, activation requests arrive as unstructured emails with no tracking or state management.

## What Changes

- Add a `ticket_type` enum and column to `b2b_support_tickets` to distinguish activation requests from general support tickets
- Add a structured "Request Activation" form to the portal support page that captures site selection and preferred activation date
- Add a `corporate_site_events` audit table to track all site status transitions with who/when/why
- Add a `wholesale_order_ref` column to `corporate_sites` for upstream order tracking
- Add a Sites section to the admin B2B account detail page showing all sites with status and technology
- Add an "Activate Site" dialog on the admin page that transitions site status and assigns technology/package
- Add an admin API endpoint for updating site status with audit event logging
- Add an Inngest function that auto-generates the first pro-rata invoice when a site transitions to `active`

## Capabilities

### New Capabilities
- `site-activation-request`: Portal-side structured activation request via the support ticket system (ticket_type=activation_request, site selection, preferred date)
- `admin-site-activation`: Admin-side site status management — view sites per account, activate with technology assignment, status transitions with audit trail
- `site-activation-billing`: Automated first-invoice generation when a site reaches `active` status, with pro-rata calculation based on activation date

### Modified Capabilities
- `portal-support`: Adding ticket_type enum (support, fault_report, activation_request, change_request) and structured form variant for activation requests
- `unjani-managed-connectivity`: Adding wholesale_order_ref tracking on corporate_sites and corporate_site_events audit table for activation state transitions

## Impact

- **Database**: 1 new enum (support_ticket_type), 1 new table (corporate_site_events), 2 new columns (b2b_support_tickets.ticket_type, corporate_sites.wholesale_order_ref)
- **Portal UI**: Modified `/portal/support` page — ticket type selector, conditional structured form
- **Portal API**: Modified `POST /api/portal/support` — accept ticket_type, auto-generate subject for activation requests
- **Admin UI**: Modified `/admin/b2b-customers/[id]` page — new Sites section with activate action
- **Admin API**: New `PATCH /api/admin/b2b-customers/site-details/[siteId]/status` endpoint
- **Inngest**: New `b2b/site.activated` event handler for pro-rata invoice generation
- **Existing billing**: No change — monthly invoice generation already scans active sites
