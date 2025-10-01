import { NextRequest } from 'next/server';
import { createClient } from '@/integrations/supabase/server';

export interface AuthenticatedUser {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'product_manager' | 'editor' | 'viewer';
}

/**
 * Get authenticated user from Supabase session
 * Returns user info if authenticated, null otherwise
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  try {
    const supabase = await createClient();

    // Get user from Supabase auth session
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // In development, allow the mock admin user
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev && user.email === 'admin@circletel.co.za') {
      return {
        id: user.id,
        email: user.email,
        full_name: 'Admin User',
        role: 'super_admin'
      };
    }

    // Fetch admin user record from database
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, email, full_name, role, is_active')
      .eq('id', user.id)
      .single();

    if (adminError || !adminUser || !adminUser.is_active) {
      return null;
    }

    return {
      id: adminUser.id,
      email: adminUser.email,
      full_name: adminUser.full_name,
      role: adminUser.role as AuthenticatedUser['role']
    };
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Require authentication for API routes
 * Returns user if authenticated, throws error otherwise
 */
export async function requireAuth(
  request: NextRequest
): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

/**
 * Check if user has required role
 */
export function hasRole(
  user: AuthenticatedUser,
  allowedRoles: AuthenticatedUser['role'][]
): boolean {
  return allowedRoles.includes(user.role);
}

/**
 * Require specific role(s) for API access
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: AuthenticatedUser['role'][]
): Promise<AuthenticatedUser> {
  const user = await requireAuth(request);

  if (!hasRole(user, allowedRoles)) {
    throw new Error('Insufficient permissions');
  }

  return user;
}
