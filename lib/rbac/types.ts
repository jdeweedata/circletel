/**
 * TypeScript types for RBAC system
 */

import { Permission } from './permissions'

export interface RoleTemplate {
  id: string
  name: string
  description: string
  department: string
  level: 'executive' | 'management' | 'staff' | 'support'
  permissions: Permission[]
  is_default?: boolean
  is_active?: boolean
  color?: string
  icon?: string
  created_at?: string
  updated_at?: string
}

export interface AdminUserWithPermissions {
  id: string
  email: string
  full_name: string
  role: string
  role_template_id: string | null
  role_template_name?: string
  department?: string
  level?: RoleTemplate['level']
  job_title?: string
  permissions: Record<string, boolean>
  custom_permissions?: Permission[]
  effective_permissions?: Permission[]
  is_active: boolean
  last_login?: string
  created_at?: string
  updated_at?: string
}

export interface PermissionCheckOptions {
  requireAll?: boolean // If true, user must have ALL specified permissions
  userId?: string // Check for specific user, defaults to current user
}

export interface PermissionGateProps {
  permissions: Permission | Permission[]
  requireAll?: boolean
  fallback?: React.ReactNode
  children: React.ReactNode
}
