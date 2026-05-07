## ADDED Requirements

### Requirement: Portal users table exists
The system SHALL maintain a `b2b_portal_users` table that maps Supabase auth users to corporate accounts and optionally to specific sites, with a role field distinguishing `admin` (head office) from `site_user` (individual site operator).

#### Scenario: Admin portal user created
- **WHEN** an admin provisions a portal user with role `admin` for a corporate account
- **THEN** a `b2b_portal_users` row is created with `auth_user_id`, `organisation_id`, `role = 'admin'`, and `site_id = NULL`

#### Scenario: Site user portal user created
- **WHEN** an admin provisions a portal user with role `site_user` for a specific site
- **THEN** a `b2b_portal_users` row is created with `auth_user_id`, `organisation_id`, `site_id` referencing a `corporate_sites` row, and `role = 'site_user'`

#### Scenario: Unique constraint on auth user per organisation
- **WHEN** a portal user already exists for a given `auth_user_id` and `organisation_id`
- **THEN** the system SHALL reject duplicate entries with a unique constraint violation

### Requirement: Portal middleware authenticates portal routes
The system SHALL intercept all `/portal/*` requests (except `/portal/login`) and verify the user has a valid Supabase session AND a corresponding `b2b_portal_users` row.

#### Scenario: Authenticated portal user accesses portal
- **WHEN** a user with a valid session and a `b2b_portal_users` row navigates to `/portal/dashboard`
- **THEN** the request proceeds to the page

#### Scenario: Unauthenticated user accesses portal
- **WHEN** a user without a valid session navigates to any `/portal/*` route (except `/portal/login`)
- **THEN** the system redirects to `/portal/login`

#### Scenario: Authenticated user without portal mapping
- **WHEN** a user with a valid Supabase session but NO `b2b_portal_users` row navigates to `/portal/dashboard`
- **THEN** the system redirects to `/portal/login` with an error parameter indicating no portal access

### Requirement: RLS policies scope data by organisation and role
The system SHALL enforce row-level security on `corporate_accounts`, `corporate_sites`, and related tables so that portal users can only SELECT rows belonging to their organisation, and `site_user` role users are further restricted to their assigned site.

#### Scenario: Admin role queries all sites
- **WHEN** a portal user with `role = 'admin'` queries `corporate_sites`
- **THEN** the system returns all sites where `corporate_id` matches their `organisation_id`

#### Scenario: Site user queries sites
- **WHEN** a portal user with `role = 'site_user'` queries `corporate_sites`
- **THEN** the system returns only the site matching their `site_id`

#### Scenario: Portal user queries another organisation's data
- **WHEN** a portal user queries `corporate_sites` for a `corporate_id` not matching their `organisation_id`
- **THEN** the system returns zero rows

### Requirement: Admin can provision portal users
The system SHALL allow admin users (via `/admin/b2b-customers`) to create portal user accounts by specifying email, role, and optionally a site assignment. The system SHALL use Supabase's invite flow to send credentials.

#### Scenario: Admin invites a head office user
- **WHEN** an admin creates a portal user with email `headoffice@unjani.org` and role `admin` for account CT-UNJ-001
- **THEN** a Supabase auth user is created (or existing user linked), a `b2b_portal_users` row is inserted, and an invite email is sent

#### Scenario: Admin invites a site user
- **WHEN** an admin creates a portal user with email `nurse@unjani.org`, role `site_user`, and site "Chloorkop"
- **THEN** a `b2b_portal_users` row is created linking the auth user to the specific site

#### Scenario: Admin removes portal access
- **WHEN** an admin deletes a portal user entry
- **THEN** the `b2b_portal_users` row is removed and the user can no longer access the portal (auth user remains in Supabase for potential reactivation)

### Requirement: Auth provider exclusions prevent context conflicts
The `PortalAuthProvider` SHALL NOT initialize on `/admin/*`, `/partners/*`, `/dashboard/*`, or `/ambassadors/*` paths. Conversely, `CustomerAuthProvider` SHALL NOT initialize on `/portal/*` paths.

#### Scenario: Portal auth provider skips admin pages
- **WHEN** a user navigates to `/admin/dashboard`
- **THEN** `PortalAuthProvider` does not initialize and does not interfere with admin auth

#### Scenario: Customer auth provider skips portal pages
- **WHEN** a user navigates to `/portal/dashboard`
- **THEN** `CustomerAuthProvider` does not initialize and does not interfere with portal auth
