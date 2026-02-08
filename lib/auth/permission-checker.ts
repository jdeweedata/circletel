/**
 * Permission Checker Utility
 *
 * Provides a clear, type-safe API for checking user permissions.
 * Can be used both in React components and server-side code.
 *
 * @example
 * // Check single permission
 * if (canAccess(user, 'products:edit')) { ... }
 *
 * // Check multiple permissions (any)
 * if (canAccessAny(user, ['orders:view', 'orders:edit'])) { ... }
 *
 * // Check multiple permissions (all)
 * if (canAccessAll(user, ['orders:view', 'orders:edit'])) { ... }
 *
 * // Resource-based checking
 * if (can(user).view('products')) { ... }
 * if (can(user).edit('orders')) { ... }
 */

import type { AdminUser } from './session-storage';
import type { Permission } from '@/lib/rbac/permissions';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Role hierarchy - higher index = more permissions
 */
const ROLE_HIERARCHY = [
  'viewer',
  'support',
  'sales',
  'technician',
  'billing',
  'product_manager',
  'admin',
  'super_admin',
] as const;

type AdminRole = (typeof ROLE_HIERARCHY)[number];

/**
 * Resource actions for the `can` API
 */
type ResourceAction = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'manage';

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Check if user has a specific permission
 */
export function canAccess(user: AdminUser | null, permission: Permission | string): boolean {
  if (!user) return false;

  // Super admin has all permissions
  if (user.role === 'super_admin') return true;

  // Check specific permission in user's permissions object
  return user.permissions?.[permission] === true;
}

/**
 * Check if user has ANY of the specified permissions
 */
export function canAccessAny(user: AdminUser | null, permissions: (Permission | string)[]): boolean {
  if (!user) return false;
  if (user.role === 'super_admin') return true;

  return permissions.some((permission) => canAccess(user, permission));
}

/**
 * Check if user has ALL of the specified permissions
 */
export function canAccessAll(user: AdminUser | null, permissions: (Permission | string)[]): boolean {
  if (!user) return false;
  if (user.role === 'super_admin') return true;

  return permissions.every((permission) => canAccess(user, permission));
}

/**
 * Check if user has at least the specified role level
 */
export function hasRoleLevel(user: AdminUser | null, minRole: AdminRole): boolean {
  if (!user) return false;

  const userRoleIndex = ROLE_HIERARCHY.indexOf(user.role as AdminRole);
  const minRoleIndex = ROLE_HIERARCHY.indexOf(minRole);

  if (userRoleIndex === -1 || minRoleIndex === -1) return false;

  return userRoleIndex >= minRoleIndex;
}

/**
 * Check if user is a super admin
 */
export function isSuperAdmin(user: AdminUser | null): boolean {
  return user?.role === 'super_admin';
}

/**
 * Check if user can approve items (super_admin or product_manager)
 */
export function canApprove(user: AdminUser | null): boolean {
  if (!user) return false;
  return user.role === 'super_admin' || user.role === 'product_manager';
}

/**
 * Check if user can edit (not a viewer)
 */
export function canEdit(user: AdminUser | null): boolean {
  if (!user) return false;
  return user.role !== 'viewer';
}

// ============================================================================
// FLUENT API
// ============================================================================

/**
 * Fluent API for permission checking
 *
 * @example
 * can(user).view('products')     // Check products:view
 * can(user).edit('orders')       // Check orders:edit
 * can(user).manage('users')      // Check users:manage
 */
export function can(user: AdminUser | null) {
  const check = (action: ResourceAction, resource: string): boolean => {
    const permission = `${resource}:${action}` as Permission;
    return canAccess(user, permission);
  };

  return {
    view: (resource: string) => check('view', resource),
    create: (resource: string) => check('create', resource),
    edit: (resource: string) => check('edit', resource),
    delete: (resource: string) => check('delete', resource),
    approve: (resource: string) => check('approve', resource),
    manage: (resource: string) => check('manage', resource),

    /** Check any permission directly */
    access: (permission: Permission | string) => canAccess(user, permission),

    /** Check any of multiple permissions */
    accessAny: (permissions: (Permission | string)[]) => canAccessAny(user, permissions),

    /** Check all of multiple permissions */
    accessAll: (permissions: (Permission | string)[]) => canAccessAll(user, permissions),
  };
}

// ============================================================================
// PERMISSION GUARD (for server-side use)
// ============================================================================

/**
 * Permission guard result
 */
export interface PermissionGuardResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Check permissions and return a structured result
 * Useful for API routes that need to return error messages
 *
 * @example
 * const guard = checkPermission(user, 'products:edit');
 * if (!guard.allowed) {
 *   return NextResponse.json({ error: guard.reason }, { status: 403 });
 * }
 */
export function checkPermission(
  user: AdminUser | null,
  permission: Permission | string
): PermissionGuardResult {
  if (!user) {
    return { allowed: false, reason: 'Authentication required' };
  }

  if (!canAccess(user, permission)) {
    return {
      allowed: false,
      reason: `Missing required permission: ${permission}`,
    };
  }

  return { allowed: true };
}

/**
 * Check multiple permissions and return a structured result
 */
export function checkPermissions(
  user: AdminUser | null,
  permissions: (Permission | string)[],
  options: { requireAll?: boolean } = {}
): PermissionGuardResult {
  if (!user) {
    return { allowed: false, reason: 'Authentication required' };
  }

  const { requireAll = false } = options;

  const hasAccess = requireAll
    ? canAccessAll(user, permissions)
    : canAccessAny(user, permissions);

  if (!hasAccess) {
    const mode = requireAll ? 'all' : 'any';
    return {
      allowed: false,
      reason: `Missing required permissions (need ${mode}): ${permissions.join(', ')}`,
    };
  }

  return { allowed: true };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  canAccess,
  canAccessAny,
  canAccessAll,
  hasRoleLevel,
  isSuperAdmin,
  canApprove,
  canEdit,
  can,
  checkPermission,
  checkPermissions,
};
