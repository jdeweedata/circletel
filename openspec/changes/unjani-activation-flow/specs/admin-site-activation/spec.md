## ADDED Requirements

### Requirement: Admin can view sites per B2B account
The system SHALL display a Sites section on the admin B2B account detail page (`/admin/b2b-customers/[id]`) showing all sites belonging to that account.

#### Scenario: Sites table displays on account detail page
- **WHEN** an admin views `/admin/b2b-customers/[id]`
- **THEN** the page SHALL show a Sites section below the account info cards, listing all corporate_sites for that organisation with columns: site name, status (badge), technology, monthly fee, and an actions column

#### Scenario: Sites filterable by status
- **WHEN** an admin views the Sites section
- **THEN** a status filter SHALL allow filtering by: all, pending, ready, provisioned, active, suspended

#### Scenario: Empty sites state
- **WHEN** an account has no sites
- **THEN** the Sites section SHALL show "No sites found for this account"

### Requirement: Admin can activate a site
The system SHALL provide an "Activate" button for sites in `pending` or `ready` status that opens a dialog to assign technology and begin the activation process.

#### Scenario: Activate button visible for eligible sites
- **WHEN** a site has status `pending` or `ready`
- **THEN** an "Activate" button SHALL appear in the actions column

#### Scenario: Activate button hidden for ineligible sites
- **WHEN** a site has status `provisioned`, `active`, `suspended`, or `decommissioned`
- **THEN** no "Activate" button SHALL appear (status-appropriate actions may appear instead)

#### Scenario: Activate dialog fields
- **WHEN** an admin clicks "Activate" on a site
- **THEN** a dialog SHALL appear with: technology selector (tarana_fwb, lte_5g, ftth, fwa), package auto-selected as UNJ-MC-001 (for Unjani accounts), optional install date, optional installer name, optional wholesale order reference, and optional notes

#### Scenario: Successful activation
- **WHEN** an admin fills in the activation dialog and confirms
- **THEN** the system SHALL update the site's status to `provisioned`, set the technology, package_id, monthly_fee, and wholesale_order_ref, log an audit event, and refresh the sites list

### Requirement: Admin can transition site to active
The system SHALL allow admin to mark a provisioned site as `active` once connectivity is confirmed live.

#### Scenario: Mark active button on provisioned sites
- **WHEN** a site has status `provisioned`
- **THEN** a "Mark Active" button SHALL appear in the actions column

#### Scenario: Marking site active
- **WHEN** an admin clicks "Mark Active" on a provisioned site and confirms
- **THEN** the system SHALL update status to `active`, set `installed_at` to current timestamp if not already set, log an audit event, and trigger the `b2b/site.activated` Inngest event

### Requirement: All site status changes are audited
The system SHALL log every site status transition in the `corporate_site_events` table.

#### Scenario: Audit event logged on status change
- **WHEN** a site status is changed via the admin API
- **THEN** a row SHALL be inserted into `corporate_site_events` with site_id, event_type ('status_change'), old_value (previous status), new_value (new status), performed_by (admin user ID), and notes

#### Scenario: Audit events queryable per site
- **WHEN** viewing a site's history
- **THEN** all audit events for that site SHALL be retrievable ordered by created_at descending

### Requirement: Admin activation API validates state transitions
The system SHALL enforce valid state transitions and reject invalid ones.

#### Scenario: Valid transitions
- **WHEN** an admin requests a status change
- **THEN** the system SHALL only allow: pending→ready, pending→provisioned, ready→provisioned, provisioned→active, active→suspended, suspended→active, active→decommissioned

#### Scenario: Invalid transition rejected
- **WHEN** an admin requests an invalid transition (e.g., pending→active, active→pending)
- **THEN** the API SHALL return 400 with error "Invalid status transition from {current} to {requested}"
