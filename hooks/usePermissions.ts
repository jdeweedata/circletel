/**
 * React Hook for Permission Checking
 *
 * Provides easy-to-use hooks for checking user permissions in components.
 */

import { useMemo } from 'react'
import { useAdminAuth } from './useAdminAuth'
import { Permission } from '@/lib/rbac/permissions'
import { PermissionCheckOptions } from '@/lib/rbac/types'

export function usePermissions() {
  const { user } = useAdminAuth()

  /**
   * Check if user has a specific permission
   */
  const hasPermission = useMemo(
    () => (permission: Permission): boolean => {
      if (!user) {
        console.warn('[usePermissions] No user found, denying permission:', permission)
        return false
      }

      // Super admin has all permissions
      if (user.role === 'super_admin') {
        return true
      }

      // Check permissions object
      const hasAccess = user.permissions?.[permission] === true
      return hasAccess
    },
    [user]
  )

  /**
   * Check if user has ANY of the specified permissions
   */
  const hasAnyPermission = useMemo(
    () => (permissions: Permission[]): boolean => {
      if (!user) return false
      if (user.role === 'super_admin') return true

      return permissions.some(permission => hasPermission(permission))
    },
    [user, hasPermission]
  )

  /**
   * Check if user has ALL of the specified permissions
   */
  const hasAllPermissions = useMemo(
    () => (permissions: Permission[]): boolean => {
      if (!user) return false
      if (user.role === 'super_admin') return true

      return permissions.every(permission => hasPermission(permission))
    },
    [user, hasPermission]
  )

  /**
   * Check permissions with options
   */
  const checkPermissions = useMemo(
    () =>
      (
        permissions: Permission | Permission[],
        options?: PermissionCheckOptions
      ): boolean => {
        const permArray = Array.isArray(permissions) ? permissions : [permissions]

        if (options?.requireAll) {
          return hasAllPermissions(permArray)
        }

        return hasAnyPermission(permArray)
      },
    [hasAnyPermission, hasAllPermissions]
  )

  /**
   * Get all permissions for current user
   */
  const userPermissions = useMemo(() => {
    if (!user) return []

    // Super admin has all permissions
    if (user.role === 'super_admin') {
      return Object.keys(user.permissions || {}) as Permission[]
    }

    // Return only permissions that are true
    return Object.entries(user.permissions || {})
      .filter(([_, value]) => value === true)
      .map(([key]) => key as Permission)
  }, [user])

  /**
   * Check if user can perform an action (convenience methods)
   */
  const can = {
    view: (resource: string) => hasPermission(`${resource}:view` as Permission),
    create: (resource: string) => hasPermission(`${resource}:create` as Permission),
    edit: (resource: string) => hasPermission(`${resource}:edit` as Permission),
    delete: (resource: string) => hasPermission(`${resource}:delete` as Permission),
    approve: (resource: string) => hasPermission(`${resource}:approve` as Permission),
    manage: (resource: string) => hasPermission(`${resource}:manage` as Permission),
  }

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    checkPermissions,
    userPermissions,
    can,
    isLoaded: !!user,
  }
}

/**
 * Hook to check a specific permission
 * Returns boolean and loading state
 */
export function useHasPermission(permission: Permission) {
  const { hasPermission, isLoaded } = usePermissions()

  return {
    hasPermission: hasPermission(permission),
    isLoading: !isLoaded,
  }
}

/**
 * Hook to check multiple permissions
 */
export function useHasPermissions(
  permissions: Permission[],
  requireAll = false
) {
  const { checkPermissions, isLoaded } = usePermissions()

  return {
    hasPermissions: checkPermissions(permissions, { requireAll }),
    isLoading: !isLoaded,
  }
}
