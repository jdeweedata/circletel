# Feature Registry & Admin Navigation

**Module**: `lib/features/` | **Since**: Phase 0 (2026-07)
**Spec**: `docs/superpowers/specs/2026-07-09-whitelabel-platform-design.md` §6

## What

The feature registry is the single source of truth for all admin sections,
workspaces, and access control. Instead of hard-coding a sidebar menu in
React, we define sections once as data — and navigation is generated from
that data.

Key property: **beta and internal sections are automatically hidden from
non-admin users**, so unfinished features don't clutter the UI.

## Sections & Workspaces

**Five workspaces** organize admin tasks by user role:

| Workspace | Users | Purpose |
|-----------|-------|---------|
| **finance** | Finance manager, admin | Invoicing, debit batches, reconciliation |
| **sales** | Sales manager, admin | Offers, campaigns, leads, partners |
| **ops** | Ops manager, admin | Vetting, onboarding, coverage, fulfillment |
| **support** | Support agent, admin | Customer 360, tickets, diagnostics |
| **executive** | Executive, admin | KPI dashboard, analytics (read-only) |

Each section declares:
- **Route**: `/admin/billing/invoices`
- **Maturity**: `stable`, `beta`, or `internal`
- **Roles**: who can see it: `['admin', 'finance-manager']`
- **Feature flag** (optional): e.g., `unjani` must be enabled to show this section

## Usage

### For developers: Get visible sections for a user

```typescript
import { getAdminRegistry } from '@/lib/features';

const registry = getAdminRegistry();

// All sections this user can see
const sections = registry.getSectionsForUser({
  roles: ['finance-manager'],
  maturityAccess: 'stable', // beta & internal hidden
});

// Sections grouped by workspace
const workspaces = registry.getWorkspacesForUser({
  roles: ['finance-manager'],
  maturityAccess: 'stable',
});

// Sections in a specific workspace
const financeSections = registry.getSectionsForWorkspace('finance', {
  roles: ['finance-manager'],
  maturityAccess: 'stable',
});
```

### For React components: Generate navigation

```tsx
import { getAdminRegistry } from '@/lib/features';
import { useAuth } from '@/hooks/use-auth';

export function AdminSidebar() {
  const { user } = useAuth();
  const registry = getAdminRegistry();

  const workspaces = registry.getWorkspacesForUser({
    roles: user.roles,
    maturityAccess: user.maturityAccess,
  });

  return (
    <nav>
      {workspaces.map((workspace) => {
        const sections = registry.getSectionsForWorkspace(workspace, {
          roles: user.roles,
          maturityAccess: user.maturityAccess,
        });
        return (
          <div key={workspace}>
            <h3>{workspace}</h3>
            {sections.map((section) => (
              <Link key={section.id} href={section.route}>
                {section.icon && <Icon name={section.icon} />}
                {section.name}
              </Link>
            ))}
          </div>
        );
      })}
    </nav>
  );
}
```

## Adding a new admin section

1. Open `lib/features/registry.ts`
2. Add your section to `CIRCLETEL_SECTIONS`:

```typescript
{
  id: 'my-feature-id',
  route: '/admin/workspace/my-feature',
  name: 'My Feature',
  icon: 'Settings',           // Lucide icon name
  workspace: 'ops',            // one of the 5 workspaces
  roles: ['admin', 'ops-manager'],
  maturity: 'stable',          // or 'beta' / 'internal'
  featureFlag: 'my_feature',   // optional: if present, feature must be enabled
  order: 1,                     // sort order in workspace
  description: 'What this does',
}
```

3. The section is **immediately visible** in the registry (no restart needed).
4. If in beta/internal, use `maturityAccess: 'beta'` in tests to see it.

## Maturity levels

| Level | Visibility | Use case |
|-------|------------|----------|
| **stable** | Everyone with role access | Production-ready features |
| **beta** | Only users with `maturityAccess: 'beta'` | Features in testing (usually just admins) |
| **internal** | Only users with `maturityAccess: 'internal'` | Dev-only, internal tooling (never shown to regular staff) |

Staff (non-admin users) always see only `stable` sections.

## Feature flags

If an admin section requires a feature to be enabled, set `featureFlag`:

```typescript
{
  id: 'unjani-onboarding',
  featureFlag: 'unjani',  // Only visible if unjani is enabled
  ...
}
```

The tenant config layer (`lib/tenant/`) returns feature flags per tenant.
The registry respects them when filtering.

## Testing

```typescript
import { getAdminRegistry, resetRegistryForTests } from '@/lib/features';

describe('My feature permissions', () => {
  afterEach(() => {
    resetRegistryForTests(); // Clear cache
  });

  it('shows to sales managers in stable', () => {
    const registry = getAdminRegistry();
    const sections = registry.getSectionsForUser({
      roles: ['sales-manager'],
      maturityAccess: 'stable',
    });
    expect(sections.some((s) => s.id === 'offers-manager')).toBe(true);
  });

  it('hides beta sections from sales managers', () => {
    const registry = getAdminRegistry();
    const sections = registry.getSectionsForUser({
      roles: ['sales-manager'],
      maturityAccess: 'stable',
    });
    expect(sections.every((s) => s.maturity !== 'beta')).toBe(true);
  });
});
```

## Rules

1. **Every new admin page must be registered** — no sidebar links without registry entries.
2. **beta → stable is semantic**: once a feature moves from beta to stable,
   `maturityAccess` filtering handles visibility (no code changes needed).
3. **Roles are OR'd**: if user has ANY of the section's roles (or is 'admin'),
   they can see it (provided maturity check passes).
4. **Feature flags are AND'd**: section is hidden if its `featureFlag` is disabled,
   even if the user has the role.
