## ADDED Requirements

### Requirement: Corporate sites track wholesale order reference
The system SHALL store the upstream wholesale provider order reference on each corporate site for reconciliation.

#### Scenario: Wholesale order ref stored on activation
- **WHEN** an admin activates a site and provides a wholesale order reference
- **THEN** the `corporate_sites.wholesale_order_ref` column SHALL be set to the provided value

#### Scenario: Wholesale order ref is optional
- **WHEN** an admin activates a site without providing a wholesale order reference
- **THEN** `wholesale_order_ref` SHALL remain NULL

### Requirement: Site status transitions are auditable
The system SHALL maintain a `corporate_site_events` table recording all status changes for corporate sites.

#### Scenario: Event table schema
- **WHEN** querying the `corporate_site_events` table
- **THEN** it SHALL have columns: id (uuid PK), site_id (FK to corporate_sites), event_type (text), old_value (jsonb), new_value (jsonb), performed_by (uuid, nullable), notes (text, nullable), created_at (timestamptz)

#### Scenario: Events linked to sites
- **WHEN** a corporate_site is deleted
- **THEN** all related corporate_site_events SHALL be cascade deleted

#### Scenario: RLS policy for admin access
- **WHEN** an admin user queries corporate_site_events
- **THEN** the service role client SHALL bypass RLS (admin APIs use service role)
