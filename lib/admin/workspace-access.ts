/**
 * Edge-safe workspace + module authorization for admin routes (PR5 + PR2.5).
 *
 * Imported by middleware (edge runtime), so this MUST stay pure: no React, no
 * icons, and no VALUE import of feature-registry.ts (it pulls react-icons + a
 * JSX component and is not edge-safe). The `import type` below is erased at
 * compile time, so the type is shared without a runtime dependency.
 * WORKSPACE_ROLES mirrors feature-registry's WORKSPACES and each route's
 * `module` mirrors ITEM_MODULE; parity tests lock all three together.
 *
 * See docs/2026-07-12-pr5-server-route-guards.md and
 * docs/2026-07-12-pr25-module-entitlement.md.
 */
import type { AdminRole } from '@/lib/auth/constants';
import type { ModuleId } from '@/lib/admin/feature-registry';

export type WorkspaceId =
  | 'executive' | 'finance' | 'sales' | 'ops' | 'support' | 'platform' | 'admin';

// Canonical runtime module list. Record<ModuleId, true> makes the compiler
// error here if the registry's ModuleId union ever gains/loses a member.
const MODULE_IDS: Record<ModuleId, true> = {
  billing: true, ra: true, offers: true, sales: true, crm: true, orders: true,
  field: true, coverage: true, network: true, compliance: true, portal: true,
  checkout: true, workflows: true, integrations: true, core: true,
};
export const ALL_MODULES = Object.keys(MODULE_IDS) as ModuleId[];

export function isModuleId(v: string): v is ModuleId {
  return v in MODULE_IDS;
}

const ELEVATED: AdminRole[] = ['super_admin', 'product_manager'];
const OPERATIONAL: AdminRole[] = ['super_admin', 'product_manager', 'editor'];
const READ_ALL: AdminRole[] = ['super_admin', 'product_manager', 'editor', 'viewer'];

/** B1a mapping — must match feature-registry WORKSPACES (parity-tested). */
export const WORKSPACE_ROLES: Record<WorkspaceId, AdminRole[]> = {
  executive: READ_ALL,
  finance: OPERATIONAL,
  sales: OPERATIONAL,
  ops: OPERATIONAL,
  support: READ_ALL,
  platform: OPERATIONAL,
  admin: ELEVATED,
};

/**
 * Route prefix -> owning workspace + sellable module, derived from the
 * registry's real hrefs (ITEM_WORKSPACE / ITEM_MODULE — parity-tested).
 * Matched longest-prefix-first. Executive (Dashboard lives at '/admin') is a
 * special case in workspaceForPathname, not a prefix — a '/admin' prefix would
 * swallow every admin route.
 */
export const ADMIN_WORKSPACE_ROUTES: ReadonlyArray<{
  prefix: string;
  workspace: WorkspaceId;
  module: ModuleId;
}> = [
  // finance
  { prefix: '/admin/billing', workspace: 'finance', module: 'billing' },
  { prefix: '/admin/payments', workspace: 'finance', module: 'billing' },
  { prefix: '/admin/finance', workspace: 'finance', module: 'billing' },
  // sales (coverage/checker must beat platform's /admin/coverage — longest-first handles it)
  { prefix: '/admin/coverage/checker', workspace: 'sales', module: 'coverage' },
  { prefix: '/admin/sales-engine', workspace: 'sales', module: 'sales' },
  { prefix: '/admin/sales/feasibility', workspace: 'sales', module: 'coverage' },
  { prefix: '/admin/competitor-analysis', workspace: 'sales', module: 'sales' },
  { prefix: '/admin/products', workspace: 'sales', module: 'offers' },
  { prefix: '/admin/quotes', workspace: 'sales', module: 'offers' },
  { prefix: '/admin/cpq', workspace: 'sales', module: 'offers' },
  { prefix: '/admin/partners', workspace: 'sales', module: 'sales' },
  { prefix: '/admin/marketing', workspace: 'sales', module: 'sales' },
  { prefix: '/admin/cms', workspace: 'sales', module: 'sales' },
  // ops
  { prefix: '/admin/contracts', workspace: 'ops', module: 'orders' },
  // "Installation Schedule" is a Field Operations child living under the orders
  // URL namespace — longest-prefix wins so its module is 'field', not 'orders'.
  { prefix: '/admin/orders/installations', workspace: 'ops', module: 'field' },
  { prefix: '/admin/orders', workspace: 'ops', module: 'orders' },
  { prefix: '/admin/fulfillment', workspace: 'ops', module: 'orders' },
  { prefix: '/admin/field-ops', workspace: 'ops', module: 'field' },
  { prefix: '/admin/b2b-customers', workspace: 'ops', module: 'crm' },
  { prefix: '/admin/b2b', workspace: 'ops', module: 'crm' },
  { prefix: '/admin/unjani', workspace: 'ops', module: 'crm' },
  { prefix: '/admin/corporate', workspace: 'ops', module: 'crm' },
  { prefix: '/admin/compliance', workspace: 'ops', module: 'compliance' },
  { prefix: '/admin/kyc', workspace: 'ops', module: 'compliance' },
  { prefix: '/admin/workflow', workspace: 'ops', module: 'compliance' }, // "Approvals" item
  // support
  { prefix: '/admin/support', workspace: 'support', module: 'crm' },
  { prefix: '/admin/customers', workspace: 'support', module: 'crm' },
  { prefix: '/admin/diagnostics', workspace: 'support', module: 'crm' },
  // platform
  { prefix: '/admin/coverage', workspace: 'platform', module: 'coverage' },
  { prefix: '/admin/network', workspace: 'platform', module: 'network' },
  { prefix: '/admin/notifications', workspace: 'platform', module: 'core' },
  { prefix: '/admin/integrations', workspace: 'platform', module: 'integrations' },
  { prefix: '/admin/zoho', workspace: 'platform', module: 'integrations' },
  // admin (Administration) — the security-critical set
  { prefix: '/admin/orchestrator', workspace: 'admin', module: 'workflows' },
  { prefix: '/admin/users', workspace: 'admin', module: 'core' },
  { prefix: '/admin/settings', workspace: 'admin', module: 'core' },
];

// Precompute longest-first once (module load).
const ROUTES_BY_LEN = [...ADMIN_WORKSPACE_ROUTES].sort((a, b) => b.prefix.length - a.prefix.length);

function routeFor(pathname: string): (typeof ADMIN_WORKSPACE_ROUTES)[number] | null {
  const path = pathname.split('?')[0];
  for (const r of ROUTES_BY_LEN) {
    if (path === r.prefix || path.startsWith(r.prefix + '/')) return r;
  }
  return null;
}

function isExecutivePath(pathname: string): boolean {
  const path = pathname.split('?')[0];
  // Executive: Dashboard lives at '/admin' (and the post-login '/admin/dashboard').
  return path === '/admin' || path === '/admin/dashboard' || path.startsWith('/admin/dashboard/');
}

/** Owning workspace for a pathname, or null if not a registered admin route. */
export function workspaceForPathname(pathname: string): WorkspaceId | null {
  if (isExecutivePath(pathname)) return 'executive';
  return routeFor(pathname)?.workspace ?? null;
}

/** Owning sellable module for a pathname, or null if not a registered admin route. */
export function moduleForPathname(pathname: string): ModuleId | null {
  if (isExecutivePath(pathname)) return 'core';
  return routeFor(pathname)?.module ?? null;
}

/**
 * Server authorization for an admin path: role must enter the workspace AND
 * (when `modules` is passed) the tenant must have the route's module enabled.
 * Omitted `modules` = all modules on (pre-PR2.5 behaviour).
 * Unmapped admin routes fail OPEN (true) — the caller logs. Sensitive
 * Administration/finance/etc. prefixes ARE mapped + parity-tested, so fail-open
 * only affects routes not in the registry.
 * ponytail: tighten to default-deny after a full admin-route audit (catch-all row).
 */
export function canAccessAdminPath(
  role: AdminRole,
  pathname: string,
  modules?: ModuleId[]
): boolean {
  const ws = workspaceForPathname(pathname);
  if (!ws) return true;
  if (!WORKSPACE_ROLES[ws].includes(role)) return false;
  if (modules) {
    const m = moduleForPathname(pathname);
    if (m && !modules.includes(m)) return false;
  }
  return true;
}
