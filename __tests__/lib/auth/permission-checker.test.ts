/**
 * Permission Checker Tests
 *
 * Comprehensive tests for all permission checking scenarios.
 */

import {
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
} from '@/lib/auth/permission-checker';
import type { AdminUser } from '@/lib/auth/session-storage';

// ============================================================================
// TEST FIXTURES
// ============================================================================

const createUser = (overrides: Partial<AdminUser> = {}): AdminUser => ({
  id: 'user-123',
  email: 'test@example.com',
  role: 'viewer',
  permissions: {},
  ...overrides,
});

const superAdmin = createUser({
  role: 'super_admin',
  permissions: {},
});

const productManager = createUser({
  role: 'product_manager',
  permissions: {
    'products:view': true,
    'products:edit': true,
    'products:approve': true,
    'orders:view': true,
  },
});

const salesUser = createUser({
  role: 'sales',
  permissions: {
    'orders:view': true,
    'orders:create': true,
    'customers:view': true,
  },
});

const viewer = createUser({
  role: 'viewer',
  permissions: {
    'products:view': true,
    'orders:view': true,
  },
});

// ============================================================================
// TESTS: canAccess
// ============================================================================

describe('canAccess', () => {
  it('returns false for null user', () => {
    expect(canAccess(null, 'products:view')).toBe(false);
  });

  it('returns true for super_admin regardless of permission', () => {
    expect(canAccess(superAdmin, 'products:view')).toBe(true);
    expect(canAccess(superAdmin, 'nonexistent:permission')).toBe(true);
    expect(canAccess(superAdmin, 'anything:goes')).toBe(true);
  });

  it('returns true if user has the specific permission', () => {
    expect(canAccess(salesUser, 'orders:view')).toBe(true);
    expect(canAccess(salesUser, 'orders:create')).toBe(true);
    expect(canAccess(salesUser, 'customers:view')).toBe(true);
  });

  it('returns false if user lacks the permission', () => {
    expect(canAccess(salesUser, 'products:edit')).toBe(false);
    expect(canAccess(salesUser, 'orders:delete')).toBe(false);
    expect(canAccess(viewer, 'products:edit')).toBe(false);
  });

  it('returns false for undefined permissions object', () => {
    const userNoPerms = createUser({ permissions: undefined });
    expect(canAccess(userNoPerms, 'products:view')).toBe(false);
  });
});

// ============================================================================
// TESTS: canAccessAny
// ============================================================================

describe('canAccessAny', () => {
  it('returns false for null user', () => {
    expect(canAccessAny(null, ['products:view', 'orders:view'])).toBe(false);
  });

  it('returns true for super_admin', () => {
    expect(canAccessAny(superAdmin, ['products:view', 'orders:view'])).toBe(true);
  });

  it('returns true if user has any of the permissions', () => {
    expect(canAccessAny(salesUser, ['products:edit', 'orders:view'])).toBe(true);
    expect(canAccessAny(salesUser, ['orders:create', 'products:delete'])).toBe(true);
  });

  it('returns false if user has none of the permissions', () => {
    expect(canAccessAny(salesUser, ['products:edit', 'products:delete'])).toBe(false);
    expect(canAccessAny(viewer, ['orders:create', 'orders:delete'])).toBe(false);
  });

  it('returns true for empty permissions array with super_admin', () => {
    expect(canAccessAny(superAdmin, [])).toBe(true);
  });
});

// ============================================================================
// TESTS: canAccessAll
// ============================================================================

describe('canAccessAll', () => {
  it('returns false for null user', () => {
    expect(canAccessAll(null, ['products:view', 'orders:view'])).toBe(false);
  });

  it('returns true for super_admin', () => {
    expect(canAccessAll(superAdmin, ['products:view', 'orders:view'])).toBe(true);
  });

  it('returns true if user has all permissions', () => {
    expect(canAccessAll(salesUser, ['orders:view', 'orders:create'])).toBe(true);
    expect(canAccessAll(viewer, ['products:view', 'orders:view'])).toBe(true);
  });

  it('returns false if user lacks any permission', () => {
    expect(canAccessAll(salesUser, ['orders:view', 'products:edit'])).toBe(false);
    expect(canAccessAll(viewer, ['products:view', 'products:edit'])).toBe(false);
  });

  it('returns true for empty permissions array', () => {
    expect(canAccessAll(salesUser, [])).toBe(true);
    expect(canAccessAll(viewer, [])).toBe(true);
  });
});

// ============================================================================
// TESTS: hasRoleLevel
// ============================================================================

describe('hasRoleLevel', () => {
  it('returns false for null user', () => {
    expect(hasRoleLevel(null, 'viewer')).toBe(false);
  });

  it('returns true if user has exact role', () => {
    expect(hasRoleLevel(viewer, 'viewer')).toBe(true);
    expect(hasRoleLevel(superAdmin, 'super_admin')).toBe(true);
  });

  it('returns true if user has higher role', () => {
    expect(hasRoleLevel(superAdmin, 'viewer')).toBe(true);
    expect(hasRoleLevel(productManager, 'sales')).toBe(true);
    expect(hasRoleLevel(salesUser, 'viewer')).toBe(true);
  });

  it('returns false if user has lower role', () => {
    expect(hasRoleLevel(viewer, 'sales')).toBe(false);
    expect(hasRoleLevel(salesUser, 'product_manager')).toBe(false);
    expect(hasRoleLevel(productManager, 'super_admin')).toBe(false);
  });
});

// ============================================================================
// TESTS: Role-based helpers
// ============================================================================

describe('isSuperAdmin', () => {
  it('returns true for super_admin role', () => {
    expect(isSuperAdmin(superAdmin)).toBe(true);
  });

  it('returns false for other roles', () => {
    expect(isSuperAdmin(productManager)).toBe(false);
    expect(isSuperAdmin(salesUser)).toBe(false);
    expect(isSuperAdmin(viewer)).toBe(false);
  });

  it('returns false for null user', () => {
    expect(isSuperAdmin(null)).toBe(false);
  });
});

describe('canApprove', () => {
  it('returns true for super_admin', () => {
    expect(canApprove(superAdmin)).toBe(true);
  });

  it('returns true for product_manager', () => {
    expect(canApprove(productManager)).toBe(true);
  });

  it('returns false for other roles', () => {
    expect(canApprove(salesUser)).toBe(false);
    expect(canApprove(viewer)).toBe(false);
  });

  it('returns false for null user', () => {
    expect(canApprove(null)).toBe(false);
  });
});

describe('canEdit', () => {
  it('returns false for viewer role', () => {
    expect(canEdit(viewer)).toBe(false);
  });

  it('returns true for other roles', () => {
    expect(canEdit(superAdmin)).toBe(true);
    expect(canEdit(productManager)).toBe(true);
    expect(canEdit(salesUser)).toBe(true);
  });

  it('returns false for null user', () => {
    expect(canEdit(null)).toBe(false);
  });
});

// ============================================================================
// TESTS: Fluent API (can)
// ============================================================================

describe('can (fluent API)', () => {
  it('provides resource-based permission checking', () => {
    expect(can(productManager).view('products')).toBe(true);
    expect(can(productManager).edit('products')).toBe(true);
    expect(can(productManager).delete('products')).toBe(false);
  });

  it('returns false for null user', () => {
    expect(can(null).view('products')).toBe(false);
    expect(can(null).edit('orders')).toBe(false);
  });

  it('returns true for super_admin on any resource', () => {
    expect(can(superAdmin).view('anything')).toBe(true);
    expect(can(superAdmin).delete('everything')).toBe(true);
    expect(can(superAdmin).manage('system')).toBe(true);
  });

  it('provides direct access method', () => {
    expect(can(salesUser).access('orders:view')).toBe(true);
    expect(can(salesUser).access('products:edit')).toBe(false);
  });

  it('provides accessAny method', () => {
    expect(can(salesUser).accessAny(['orders:view', 'products:edit'])).toBe(true);
    expect(can(salesUser).accessAny(['products:edit', 'products:delete'])).toBe(false);
  });

  it('provides accessAll method', () => {
    expect(can(salesUser).accessAll(['orders:view', 'orders:create'])).toBe(true);
    expect(can(salesUser).accessAll(['orders:view', 'products:edit'])).toBe(false);
  });
});

// ============================================================================
// TESTS: Permission Guards
// ============================================================================

describe('checkPermission', () => {
  it('returns allowed: true for valid permission', () => {
    const result = checkPermission(salesUser, 'orders:view');
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('returns allowed: false with reason for null user', () => {
    const result = checkPermission(null, 'orders:view');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('Authentication required');
  });

  it('returns allowed: false with reason for missing permission', () => {
    const result = checkPermission(salesUser, 'products:delete');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Missing required permission');
    expect(result.reason).toContain('products:delete');
  });
});

describe('checkPermissions', () => {
  it('checks any permission by default', () => {
    const result = checkPermissions(salesUser, ['orders:view', 'products:edit']);
    expect(result.allowed).toBe(true);
  });

  it('checks all permissions when requireAll is true', () => {
    const result = checkPermissions(salesUser, ['orders:view', 'orders:create'], {
      requireAll: true,
    });
    expect(result.allowed).toBe(true);

    const result2 = checkPermissions(salesUser, ['orders:view', 'products:edit'], {
      requireAll: true,
    });
    expect(result2.allowed).toBe(false);
    expect(result2.reason).toContain('need all');
  });

  it('returns detailed reason for missing permissions', () => {
    const result = checkPermissions(salesUser, ['products:edit', 'products:delete']);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('products:edit');
    expect(result.reason).toContain('products:delete');
  });
});

// ============================================================================
// TESTS: Edge Cases
// ============================================================================

describe('Edge cases', () => {
  it('handles empty permissions object', () => {
    const userEmptyPerms = createUser({ permissions: {} });
    expect(canAccess(userEmptyPerms, 'products:view')).toBe(false);
  });

  it('handles permission set to false explicitly', () => {
    const userWithFalse = createUser({
      permissions: {
        'products:view': false as unknown as boolean,
        'orders:view': true,
      },
    });
    expect(canAccess(userWithFalse, 'products:view')).toBe(false);
    expect(canAccess(userWithFalse, 'orders:view')).toBe(true);
  });

  it('handles unknown role gracefully', () => {
    const unknownRole = createUser({ role: 'unknown_role' as AdminUser['role'] });
    expect(hasRoleLevel(unknownRole, 'viewer')).toBe(false);
    expect(canEdit(unknownRole)).toBe(true); // Not viewer, so can edit
  });
});
