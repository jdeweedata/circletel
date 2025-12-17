/**
 * Admin API Authentication Helper
 * Server-side authentication for admin API routes
 *
 * Usage:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const authResult = await authenticateAdmin(request);
 *   if (!authResult.success) {
 *     return authResult.response; // Returns 401
 *   }
 *
 *   const { user, adminUser } = authResult;
 *   // Continue with authenticated request...
 * }
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  permissions: Record<string, boolean> | string[];  // Can be object or array
  custom_permissions?: string[];
  department?: string;
  is_active: boolean;
  role_template_id?: string;
  job_title?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthSuccess {
  success: true;
  user: User;
  adminUser: AdminUser;
}

export interface AuthFailure {
  success: false;
  response: NextResponse;
  error: string;
}

export type AuthResult = AuthSuccess | AuthFailure;

/**
 * Authenticate an admin user for API requests
 * Checks Authorization header first, then falls back to cookies
 */
export async function authenticateAdmin(request: NextRequest): Promise<AuthResult> {
  try {
    let user: User | null = null;

    // First, check for Authorization header (Bearer token from localStorage)
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      // Use service role client to verify the token
      const supabaseAdmin = await createClient();
      const { data: { user: tokenUser }, error: tokenError } = await supabaseAdmin.auth.getUser(token);

      if (!tokenError && tokenUser) {
        user = tokenUser;
      }
    }

    // Fall back to cookie-based session if no valid token
    if (!user) {
      const supabaseSession = await createClientWithSession();
      const { data: { user: sessionUser }, error: authError } = await supabaseSession.auth.getUser();

      if (!authError && sessionUser) {
        user = sessionUser;
      }
    }

    if (!user) {
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: 'Unauthorized',
            details: 'No valid session found. Please log in.',
          },
          { status: 401 }
        ),
        error: 'No session',
      };
    }

    // Use service role client for admin_users check (bypasses RLS)
    const supabaseAdmin = await createClient();

    // Check if user exists in admin_users table
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('email', user.email!)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
      console.error('[Admin API Auth] User not in admin_users table:', user.email);
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: 'Forbidden',
            details: 'You do not have admin privileges.',
          },
          { status: 403 }
        ),
        error: 'Not an admin',
      };
    }

    // Check if admin account is active
    if (!adminUser.is_active) {
      console.error('[Admin API Auth] Inactive admin account:', user.email);
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: 'Forbidden',
            details: 'Your admin account is not active.',
          },
          { status: 403 }
        ),
        error: 'Inactive account',
      };
    }

    return {
      success: true,
      user,
      adminUser,
    };
  } catch (error) {
    console.error('[Admin API Auth] Unexpected error:', error);
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          details: 'Failed to authenticate request.',
        },
        { status: 500 }
      ),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if admin user has specific permission
 * Handles both object format {permission: true} and array format [permission]
 * Super admins have all permissions automatically
 */
export function hasPermission(adminUser: AdminUser, permission: string): boolean {
  // Super admins have all permissions
  if (adminUser.role === 'super_admin') {
    return true;
  }

  // Check custom_permissions array first
  if (adminUser.custom_permissions && Array.isArray(adminUser.custom_permissions)) {
    if (adminUser.custom_permissions.includes(permission)) {
      return true;
    }
  }

  // Check permissions (can be object or array)
  if (adminUser.permissions) {
    if (Array.isArray(adminUser.permissions)) {
      return adminUser.permissions.includes(permission);
    }
    if (typeof adminUser.permissions === 'object') {
      return adminUser.permissions[permission] === true;
    }
  }

  return false;
}

/**
 * Check if admin user has ANY of the specified permissions
 */
export function hasAnyPermission(adminUser: AdminUser, permissions: string[]): boolean {
  return permissions.some((permission) => hasPermission(adminUser, permission));
}

/**
 * Check if admin user has ALL of the specified permissions
 */
export function hasAllPermissions(adminUser: AdminUser, permissions: string[]): boolean {
  return permissions.every((permission) => hasPermission(adminUser, permission));
}

/**
 * Require specific permission(s) for an API route
 * Returns 403 if user doesn't have permission
 */
export function requirePermission(
  adminUser: AdminUser,
  permission: string | string[]
): NextResponse | null {
  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasAccess = hasAnyPermission(adminUser, permissions);

  if (!hasAccess) {
    console.warn(
      `[Admin API Auth] Permission denied for ${adminUser.email}: Required ${permissions.join(' or ')}`
    );
    return NextResponse.json(
      {
        success: false,
        error: 'Forbidden',
        details: `You do not have the required permission: ${permissions.join(' or ')}`,
      },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Example usage with RBAC:
 *
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   // Authenticate
 *   const authResult = await authenticateAdmin(request);
 *   if (!authResult.success) {
 *     return authResult.response;
 *   }
 *
 *   const { adminUser } = authResult;
 *
 *   // Check permission
 *   const permissionError = requirePermission(adminUser, 'quotes:read');
 *   if (permissionError) {
 *     return permissionError;
 *   }
 *
 *   // Continue with authenticated & authorized request...
 * }
 * ```
 */
