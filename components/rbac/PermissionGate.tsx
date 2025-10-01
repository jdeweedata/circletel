/**
 * Permission Gate Component
 *
 * Conditionally renders children based on user permissions.
 * Use this to hide/show UI elements based on RBAC.
 */

import { usePermissions } from '@/hooks/usePermissions'
import { Permission } from '@/lib/rbac/permissions'

interface PermissionGateProps {
  /**
   * Permission(s) required to view children
   * Can be a single permission or array of permissions
   */
  permissions: Permission | Permission[]

  /**
   * If true and multiple permissions provided, user must have ALL permissions
   * If false (default), user needs ANY of the permissions
   */
  requireAll?: boolean

  /**
   * Optional fallback content to show when user doesn't have permission
   * If not provided, nothing is rendered
   */
  fallback?: React.ReactNode

  /**
   * Content to show when user has permission
   */
  children: React.ReactNode

  /**
   * Optional loading content while checking permissions
   */
  loadingFallback?: React.ReactNode
}

export function PermissionGate({
  permissions,
  requireAll = false,
  fallback = null,
  children,
  loadingFallback = null,
}: PermissionGateProps) {
  const { checkPermissions, isLoaded } = usePermissions()

  // Show loading state
  if (!isLoaded) {
    return <>{loadingFallback}</>
  }

  // Check permissions
  const hasAccess = checkPermissions(permissions, { requireAll })

  // Render children if user has permission, fallback otherwise
  return <>{hasAccess ? children : fallback}</>
}

/**
 * Inverted Permission Gate
 * Renders children only when user DOES NOT have permission
 */
export function InvertedPermissionGate({
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: Omit<PermissionGateProps, 'loadingFallback'>) {
  const { checkPermissions, isLoaded } = usePermissions()

  if (!isLoaded) {
    return null
  }

  const hasAccess = checkPermissions(permissions, { requireAll })

  return <>{!hasAccess ? children : fallback}</>
}

/**
 * Higher-order component for permission-based rendering
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: Permission | Permission[],
  options?: {
    requireAll?: boolean
    fallback?: React.ReactNode
  }
) {
  return function PermissionWrappedComponent(props: P) {
    return (
      <PermissionGate
        permissions={permission}
        requireAll={options?.requireAll}
        fallback={options?.fallback}
      >
        <Component {...props} />
      </PermissionGate>
    )
  }
}
