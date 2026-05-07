## ADDED Requirements

### Requirement: Dashboard adapts to user role
The portal dashboard at `/portal` SHALL render a role-adaptive view: aggregate overview for `admin` users, single-site summary for `site_user` users.

#### Scenario: Admin sees aggregate dashboard
- **WHEN** a portal user with `role = 'admin'` loads `/portal`
- **THEN** the dashboard displays: total sites count, online/offline breakdown, total monthly spend, average health score across all sites, and a list of sites with alerts or degraded status

#### Scenario: Site user sees single-site dashboard
- **WHEN** a portal user with `role = 'site_user'` loads `/portal`
- **THEN** the dashboard displays their assigned site's status (online/offline), health score, connected device count, bandwidth usage summary, and next invoice amount/date

### Requirement: Dashboard shows site health summary
The dashboard SHALL display connectivity health sourced from existing `device_health_snapshots` and `ruijie_device_cache` tables, linked via `corporate_sites.ruijie_device_sn`.

#### Scenario: Site with Ruijie monitoring shows health score
- **WHEN** a site has a `ruijie_device_sn` populated and recent health snapshots exist
- **THEN** the dashboard shows the latest health score (0-100), online/offline status, and client count

#### Scenario: Site without monitoring data shows graceful fallback
- **WHEN** a site has no `ruijie_device_sn` or no recent health snapshots (e.g., MTN LTE-only site)
- **THEN** the dashboard shows site status from `corporate_sites.status` with a note "Detailed monitoring not available for this connection type"

### Requirement: Dashboard highlights alerts
The admin dashboard SHALL surface active alerts from `network_health_alerts` for sites in their organisation.

#### Scenario: Active alerts displayed
- **WHEN** unresolved alerts exist for sites in the admin's organisation
- **THEN** the dashboard displays alert summaries (site name, alert type, timestamp) sorted by most recent

#### Scenario: No active alerts
- **WHEN** no unresolved alerts exist
- **THEN** the dashboard displays a "All sites healthy" indicator

### Requirement: Portal user identity displayed
The portal layout SHALL display the logged-in user's name, email, organisation name, and role in a header/sidebar.

#### Scenario: Admin user header
- **WHEN** an admin user is logged in
- **THEN** the header shows their name, "Unjani Clinics" (organisation name), and "Head Office" role label

#### Scenario: Site user header
- **WHEN** a site user is logged in
- **THEN** the header shows their name, site name (e.g., "Chloorkop Clinic"), and "Site Manager" role label
