/**
 * Feature Registry — admin section discovery & RBAC.
 *
 * Whitelabel baseline design §6:
 * docs/superpowers/specs/2026-07-09-whitelabel-platform-design.md
 *
 * Every admin section (page, feature, tool) is registered once with its
 * route, required roles, maturity level, and workspace. Navigation is
 * generated from this registry, and half-finished (beta/internal) screens
 * are hidden from non-dev roles automatically.
 */

export type Workspace = 'finance' | 'sales' | 'ops' | 'support' | 'executive';
export type Maturity = 'stable' | 'beta' | 'internal';

/**
 * User context for filtering sections: roles they have + max maturity
 * level they should see. A non-admin with access='stable' will not see
 * 'beta' or 'internal' sections.
 */
export interface UserContext {
  roles: string[];
  maturityAccess: Maturity;
}

/**
 * A single admin section: a page, feature, or workspace grouping.
 * Rendered in the admin sidebar, searchable, accessible only if the user
 * has a required role and sufficient maturity access.
 */
export interface AdminSection {
  /** Unique ID for this section. */
  id: string;

  /** Full route: /admin/billing/invoices, /admin/offers/manager, etc. */
  route: string;

  /** Display name in sidebar. */
  name: string;

  /** Lucide icon name, e.g. 'FileText', 'DollarSign', 'Settings'. */
  icon?: string;

  /** Which workspace this section belongs to (organizes sidebar layout). */
  workspace: Workspace;

  /** Roles that can access this section (includes 'admin' by default). */
  roles: string[];

  /** Maturity: stable = production, beta = in testing, internal = dev-only. */
  maturity: Maturity;

  /**
   * Feature flag this section requires. If the flag is disabled in tenant
   * config, this section is hidden even from admins. e.g. 'unjani', 'zoho'.
   */
  featureFlag?: string;

  /** Sort order within workspace (lower = higher in menu). */
  order?: number;

  /** Brief description, e.g. for hover tooltip. */
  description?: string;
}

/**
 * The admin registry interface: query methods for sections by user context.
 */
export interface AdminRegistry {
  /**
   * Get all sections visible to a user (filtered by role + maturity).
   */
  getSectionsForUser(userContext: UserContext): AdminSection[];

  /**
   * Get all workspaces that have at least one visible section for a user.
   */
  getWorkspacesForUser(userContext: UserContext): Workspace[];

  /**
   * Get all sections in a workspace that the user can see.
   */
  getSectionsForWorkspace(
    workspace: Workspace,
    userContext: UserContext
  ): AdminSection[];

  /**
   * Get a section by ID, or undefined if not found.
   */
  getSectionById(id: string): AdminSection | undefined;

  /**
   * Register a new section (mostly for tests and dynamic additions).
   * In production, all sections are registered at module init.
   */
  register(section: AdminSection): void;
}
