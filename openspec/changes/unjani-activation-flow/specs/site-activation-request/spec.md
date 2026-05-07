## ADDED Requirements

### Requirement: Portal users can submit activation requests
The system SHALL provide a structured activation request form on the `/portal/support` page when the user selects ticket type "Activate Site".

#### Scenario: Site user submits activation request
- **WHEN** a site_user selects "Activate Site" as ticket type and submits the form
- **THEN** the system creates a support ticket with `ticket_type = 'activation_request'`, the user's assigned site auto-populated as `site_id`, and an auto-generated subject "Activate: {site_name}"

#### Scenario: Admin submits activation request with site selection
- **WHEN** an admin selects "Activate Site" as ticket type and picks a site from the dropdown
- **THEN** the system creates a support ticket with `ticket_type = 'activation_request'` and the selected `site_id`

#### Scenario: Admin cannot submit activation request without selecting a site
- **WHEN** an admin selects "Activate Site" as ticket type but does not select a site
- **THEN** the submit button SHALL be disabled and the site field SHALL show a validation indicator

### Requirement: Activation request form captures structured data
The system SHALL show a simplified form for activation requests distinct from the free-text support form.

#### Scenario: Activation form fields
- **WHEN** user selects "Activate Site" ticket type
- **THEN** the form SHALL show: site selector (auto-populated for site_user), optional preferred activation date, and optional notes field
- **THEN** the form SHALL NOT show the priority selector (activation requests default to 'medium')

#### Scenario: Auto-generated subject and description
- **WHEN** an activation request is submitted
- **THEN** the system SHALL auto-generate the subject as "Activate: {site_name}" and description as "Activation request for {site_name} at {company_name}. Preferred date: {date or 'As soon as possible'}. Notes: {notes or 'None'}"

### Requirement: Activation request sends notification email
The system SHALL send an email notification to CircleTel when an activation request is submitted.

#### Scenario: Email contains activation context
- **WHEN** an activation request ticket is submitted
- **THEN** the system sends an email to `contactus@circletel.co.za` with subject "[Portal Activation] {site_name} — {company_name}" containing organisation name, site name, submitter details, preferred date, and notes

### Requirement: Only pending or ready sites can have activation requested
The system SHALL prevent activation requests for sites that are already provisioned, active, suspended, or decommissioned.

#### Scenario: Site already active
- **WHEN** a user attempts to submit an activation request for a site with status `active`
- **THEN** the API SHALL return 400 with error "Site is already active"

#### Scenario: Site in pending or ready status
- **WHEN** a user submits an activation request for a site with status `pending` or `ready`
- **THEN** the system SHALL accept the request and create the ticket
