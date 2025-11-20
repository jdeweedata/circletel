/**
 * Role Management Types
 *
 * Type definitions for role templates and CRUD operations
 */

export type RoleLevel = 'executive' | 'management' | 'staff' | 'support';

export type RoleDepartment =
  | 'Executive'
  | 'Management'
  | 'Finance'
  | 'Product'
  | 'Operations'
  | 'Sales'
  | 'Marketing'
  | 'Support'
  | 'IT'
  | 'General';

export interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  department: RoleDepartment;
  level: RoleLevel;
  permissions: string[];
  is_default: boolean;
  is_active: boolean;
  color?: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRoleInput {
  id: string;
  name: string;
  description: string;
  department: RoleDepartment;
  level: RoleLevel;
  permissions: string[];
  color?: string;
  icon?: string;
  is_default?: boolean;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  department?: RoleDepartment;
  level?: RoleLevel;
  permissions?: string[];
  color?: string;
  icon?: string;
  is_active?: boolean;
}

export interface RoleWithUserCount extends RoleTemplate {
  user_count: number;
}

export interface RoleApiResponse {
  success: boolean;
  data?: RoleTemplate;
  error?: string;
  details?: string;
}

export interface RolesListResponse {
  success: boolean;
  data?: RoleTemplate[];
  error?: string;
}

export interface DeleteRoleResponse {
  success: boolean;
  error?: string;
  details?: string;
}
