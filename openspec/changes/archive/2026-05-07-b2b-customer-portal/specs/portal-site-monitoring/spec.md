## ADDED Requirements

### Requirement: Site list page for admin users
The system SHALL provide a `/portal/sites` page listing all sites in the admin user's organisation with status, health score, and technology type.

#### Scenario: Admin views site list
- **WHEN** an admin portal user navigates to `/portal/sites`
- **THEN** the page displays all organisation sites with columns: site name, province, status (online/offline), technology (Tarana FWB / LTE/5G), health score, and a link to site detail

#### Scenario: Site user redirected from site list
- **WHEN** a site_user navigates to `/portal/sites`
- **THEN** the system redirects to `/portal/sites/[their-site-id]`

#### Scenario: Admin filters sites
- **WHEN** an admin uses the search/filter controls on the site list
- **THEN** the list filters by site name, province, status, or technology type

### Requirement: Site detail page shows monitoring data
The system SHALL provide a `/portal/sites/[id]` page showing detailed site information and monitoring data sourced from existing infrastructure.

#### Scenario: Site detail with Ruijie monitoring
- **WHEN** a portal user views a site that has `ruijie_device_sn` populated
- **THEN** the page displays: site info (name, address, technology, contact), current status (online/offline from `ruijie_device_cache`), health score (from `device_health_snapshots`), connected client count, uptime percentage (calculated from health snapshot history over 30 days), and recent alerts

#### Scenario: Site detail without Ruijie monitoring
- **WHEN** a portal user views a site without `ruijie_device_sn` (MTN LTE-only)
- **THEN** the page displays: site info, status from `corporate_sites.status`, technology type, and a message "Automated monitoring not available — contact support for status updates"

#### Scenario: Site detail access control
- **WHEN** a `site_user` attempts to view a site that is not their assigned site
- **THEN** the system returns a 404 or redirects to their assigned site

### Requirement: Health history displayed over time
The site detail page SHALL show health score and client count trends over a configurable time range.

#### Scenario: 7-day health trend
- **WHEN** a portal user views a site with monitoring data and selects "7 days" range
- **THEN** the page displays a chart showing health score and connected client count over the past 7 days, sampled from `device_health_snapshots`

#### Scenario: 30-day health trend
- **WHEN** a portal user selects "30 days" range
- **THEN** the page displays the same metrics aggregated over 30 days
