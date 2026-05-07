## ADDED Requirements

### Requirement: Support tickets have a ticket type
The system SHALL categorize support tickets by type using a `ticket_type` column with enum values: `support`, `fault_report`, `activation_request`, `change_request`.

#### Scenario: Ticket type selector on support form
- **WHEN** a portal user opens the support form
- **THEN** a ticket type selector SHALL appear at the top with options: "Support Request", "Fault Report", "Activate Site", "Change Request"
- **THEN** "Support Request" SHALL be selected by default

#### Scenario: Ticket type stored on submission
- **WHEN** a portal user submits any ticket
- **THEN** the `ticket_type` column SHALL be set to the selected type

#### Scenario: Ticket type displayed in history
- **WHEN** a portal user views their ticket history
- **THEN** each ticket SHALL show a type badge alongside the status badge

### Requirement: Support form adapts to ticket type
The system SHALL show different form fields based on the selected ticket type.

#### Scenario: Support and fault_report types show standard form
- **WHEN** ticket type is "Support Request" or "Fault Report"
- **THEN** the form SHALL show the existing fields: subject, description, priority, and site selector (admin only)

#### Scenario: Activation request type shows structured form
- **WHEN** ticket type is "Activate Site"
- **THEN** the form SHALL show: site selector (required), preferred activation date (optional), and notes (optional)
- **THEN** subject, description, and priority fields SHALL be hidden (auto-generated)

#### Scenario: Change request type shows standard form
- **WHEN** ticket type is "Change Request"
- **THEN** the form SHALL show the same fields as "Support Request"

## MODIFIED Requirements

### Requirement: Support ticket submission
The system SHALL provide a `/portal/support` page where portal users can submit support tickets with site context pre-populated.

#### Scenario: Site user submits support ticket
- **WHEN** a site_user fills in the support form (subject, description, priority) and submits
- **THEN** the system creates a support ticket with the user's site name, account number, and contact details pre-populated as context, and `ticket_type` set to the selected type

#### Scenario: Admin submits support ticket
- **WHEN** an admin fills in the support form and optionally selects a site from a dropdown
- **THEN** the system creates a support ticket with the selected site context (or organisation-level if no site selected) and `ticket_type` set to the selected type

#### Scenario: Required fields validation
- **WHEN** a portal user submits the form without required fields (subject/description for standard types, or site for activation requests)
- **THEN** the system shows validation errors and does not submit
