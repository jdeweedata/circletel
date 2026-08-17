export const PORTAL_ROLES = [
  'admin',
  'site_user',
  'finance',
  'operations',
  'viewer',
] as const;

export type PortalRole = (typeof PORTAL_ROLES)[number];

export const INVITABLE_HQ_ROLES = ['finance', 'operations', 'viewer'] as const;
export type InvitableHqRole = (typeof INVITABLE_HQ_ROLES)[number];

export type PortalAccessTemplate =
  | 'super_user'
  | 'finance'
  | 'operations'
  | 'viewer'
  | 'site_user';

export type PortalCapability =
  | 'dashboard'
  | 'sites.read'
  | 'sites.write'
  | 'coverage.read'
  | 'coverage.write'
  | 'billing.read'
  | 'support.read'
  | 'support.write'
  | 'team.manage';

export type PortalNavKey =
  | 'dashboard'
  | 'sites'
  | 'coverage'
  | 'billing'
  | 'support'
  | 'team';

export interface PortalNavItemDef {
  key: PortalNavKey;
  href: '/' | '/sites' | '/coverage' | '/billing' | '/support' | '/team';
  label: string;
  exact?: boolean;
}

const NAV_ITEMS: Record<PortalNavKey, PortalNavItemDef> = {
  dashboard: { key: 'dashboard', href: '/', label: 'Dashboard', exact: true },
  sites: { key: 'sites', href: '/sites', label: 'Sites' },
  coverage: { key: 'coverage', href: '/coverage', label: 'Coverage' },
  billing: { key: 'billing', href: '/billing', label: 'Billing' },
  support: { key: 'support', href: '/support', label: 'Support' },
  team: { key: 'team', href: '/team', label: 'Team' },
};

const CAPABILITIES: Record<PortalRole, readonly PortalCapability[]> = {
  admin: [
    'dashboard',
    'sites.read',
    'sites.write',
    'coverage.read',
    'coverage.write',
    'billing.read',
    'support.read',
    'support.write',
    'team.manage',
  ],
  finance: ['dashboard', 'billing.read'],
  operations: [
    'dashboard',
    'sites.read',
    'sites.write',
    'coverage.read',
    'coverage.write',
    'support.read',
    'support.write',
  ],
  viewer: [
    'dashboard',
    'sites.read',
    'coverage.read',
    'billing.read',
    'support.read',
  ],
  site_user: [
    'dashboard',
    'sites.read',
    'billing.read',
    'support.read',
    'support.write',
  ],
};

const NAV_FOR_ROLE: Record<PortalRole, readonly PortalNavKey[]> = {
  admin: ['dashboard', 'sites', 'coverage', 'billing', 'support', 'team'],
  finance: ['dashboard', 'billing'],
  operations: ['dashboard', 'sites', 'coverage', 'support'],
  viewer: ['dashboard', 'sites', 'coverage', 'billing', 'support'],
  site_user: ['dashboard', 'billing', 'support'],
};

export function isPortalRole(value: string | null | undefined): value is PortalRole {
  return !!value && (PORTAL_ROLES as readonly string[]).includes(value);
}

export function isInvitableHqRole(
  value: string | null | undefined
): value is InvitableHqRole {
  return !!value && (INVITABLE_HQ_ROLES as readonly string[]).includes(value);
}

export function templateFromRole(role: PortalRole): PortalAccessTemplate {
  if (role === 'admin') return 'super_user';
  return role;
}

export function roleLabel(role: PortalRole): string {
  switch (role) {
    case 'admin':
      return 'Super User';
    case 'finance':
      return 'Finance';
    case 'operations':
      return 'Operations';
    case 'viewer':
      return 'Viewer';
    case 'site_user':
      return 'Site User';
  }
}

export function can(role: PortalRole, capability: PortalCapability): boolean {
  return CAPABILITIES[role].includes(capability);
}

export function navItemsForRole(role: PortalRole, isUnjani: boolean): PortalNavItemDef[] {
  return NAV_FOR_ROLE[role]
    .filter((key) => key !== 'coverage' || isUnjani)
    .map((key) => NAV_ITEMS[key]);
}
