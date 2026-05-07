## ADDED Requirements

### Requirement: Support ticket submission
The system SHALL provide a `/portal/support` page where portal users can submit support tickets with site context pre-populated.

#### Scenario: Site user submits support ticket
- **WHEN** a site_user fills in the support form (subject, description, priority) and submits
- **THEN** the system creates a support ticket with the user's site name, account number, and contact details pre-populated as context

#### Scenario: Admin submits support ticket
- **WHEN** an admin fills in the support form and optionally selects a site from a dropdown
- **THEN** the system creates a support ticket with the selected site context (or organisation-level if no site selected)

#### Scenario: Required fields validation
- **WHEN** a portal user submits the form without a subject or description
- **THEN** the system shows validation errors and does not submit

### Requirement: Ticket submission sends notification
The system SHALL notify CircleTel support when a portal ticket is submitted.

#### Scenario: Email notification sent
- **WHEN** a support ticket is submitted from the portal
- **THEN** the system sends an email to `contactus@circletel.co.za` with ticket details, submitter info, and site context

### Requirement: Ticket history visible
The system SHALL display previously submitted tickets on the support page.

#### Scenario: User sees their ticket history
- **WHEN** a portal user views `/portal/support`
- **THEN** the page shows a list of their previously submitted tickets with subject, date, and status (open/resolved)

#### Scenario: No previous tickets
- **WHEN** a portal user has no previously submitted tickets
- **THEN** the page shows an empty state with "No tickets submitted yet"
