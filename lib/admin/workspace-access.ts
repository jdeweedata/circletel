/**
 * Edge-safe workspace authorization for admin routes (PR5).
 *
 * Imported by middleware (edge runtime), so this MUST stay pure: no React, no
 * icons, and NO import of feature-registry.ts (it pulls react-icons + a JSX
 * component and is not edge-safe). WORKSPACE_ROLES mirrors feature-registry's
 * WORKSPACES; a parity test locks the two together.
 *
 * See docs/2026-07-12-pr5-server-route-guards.md.
 */
import type { AdminRole } from '@/lib/auth/constants';

export type WorkspaceId =
  | 'executive' | 'finance' | 'sales' | 'ops' | 'support' | 'platform' | 'admin';

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
 * Route prefix -> owning workspace, derived from the registry's real hrefs.
 * Matched longest-prefix-first. Executive (Dashboard lives at '/admin') is a
 * special case in workspaceForPathname, not a prefix — a '/admin' prefix would
 * swallow every admin route.
 */
export const ADMIN_WORKSPACE_ROUTES: ReadonlyArray<{ prefix: string; workspace: WorkspaceId }> = [
  // finance
  { prefix: '/admin/billing', workspace: 'finance' },
  { prefix: '/admin/payments', workspace: 'finance' },
  { prefix: '/admin/finance', workspace: 'finance' },
  // sales (coverage/checker must beat platform's /admin/coverage — longest-first handles it)
  { prefix: '/admin/coverage/checker', workspace: 'sales' },
  { prefix: '/admin/sales-engine', workspace: 'sales' },
  { prefix: '/admin/sales/feasibility', workspace: 'sales' },
  { prefix: '/admin/competitor-analysis', workspace: 'sales' },
  { prefix: '/admin/products', workspace: 'sales' },
  { prefix: '/admin/quotes', workspace: 'sales' },
  { prefix: '/admin/cpq', workspace: 'sales' },
  { prefix: '/admin/partners', workspace: 'sales' },
  { prefix: '/admin/marketing', workspace: 'sales' },
  { prefix: '/admin/cms', workspace: 'sales' },
  // ops
  { prefix: '/admin/contracts', workspace: 'ops' },
  { prefix: '/admin/orders', workspace: 'ops' },
  { prefix: '/admin/fulfillment', workspace: 'ops' },
  { prefix: '/admin/field-ops', workspace: 'ops' },
  { prefix: '/admin/b2b-customers', workspace: 'ops' },
  { prefix: '/admin/b2b', workspace: 'ops' },
  { prefix: '/admin/unjani', workspace: 'ops' },
  { prefix: '/admin/corporate', workspace: 'ops' },
  { prefix: '/admin/compliance', workspace: 'ops' },
  { prefix: '/admin/kyc', workspace: 'ops' },
  { prefix: '/admin/workflow', workspace: 'ops' }, // "Approvals" item
  // support
  { prefix: '/admin/support', workspace: 'support' },
  { prefix: '/admin/customers', workspace: 'support' },
  { prefix: '/admin/diagnostics', workspace: 'support' },
  // platform
  { prefix: '/admin/coverage', workspace: 'platform' },
  { prefix: '/admin/network', workspace: 'platform' },
  { prefix: '/admin/notifications', workspace: 'platform' },
  { prefix: '/admin/integrations', workspace: 'platform' },
  { prefix: '/admin/zoho', workspace: 'platform' },
  // admin (Administration) — the security-critical set
  { prefix: '/admin/orchestrator', workspace: 'admin' },
  { prefix: '/admin/users', workspace: 'admin' },
  { prefix: '/admin/settings', workspace: 'admin' },
];

// Precompute longest-first once (module load).
const ROUTES_BY_LEN = [...ADMIN_WORKSPACE_ROUTES].sort((a, b) => b.prefix.length - a.prefix.length);

/** Owning workspace for a pathname, or null if not a registered admin route. */
export function workspaceForPathname(pathname: string): WorkspaceId | null {
  const path = pathname.split('?')[0];
  // Executive: Dashboard lives at '/admin' (and the post-login '/admin/dashboard').
  if (path === '/admin' || path === '/admin/dashboard' || path.startsWith('/admin/dashboard/')) {
    return 'executive';
  }
  for (const r of ROUTES_BY_LEN) {
    if (path === r.prefix || path.startsWith(r.prefix + '/')) return r.workspace;
  }
  return null;
}

/**
 * Server authorization for an admin path.
 * Unmapped admin routes fail OPEN (true) — the caller logs. Sensitive
 * Administration/finance/etc. prefixes ARE mapped + parity-tested, so fail-open
 * only affects routes not in the registry.
 * ponytail: tighten to default-deny after a full admin-route audit (catch-all row).
 */
export function canAccessAdminPath(role: AdminRole, pathname: string): boolean {
  const ws = workspaceForPathname(pathname);
  return ws ? WORKSPACE_ROLES[ws].includes(role) : true;
}
