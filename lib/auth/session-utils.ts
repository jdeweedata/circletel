/**
 * Session Management Utilities
 * Reusable functions for authentication and session management
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Database query timeout configuration
 */
export const QUERY_TIMEOUTS = {
  CUSTOMER_FETCH: 10000, // 10 seconds
  DEFAULT: 5000,         // 5 seconds
} as const;

/**
 * Page route patterns for auth exclusion
 */
export const AUTH_EXCLUDED_ROUTES = {
  admin: '/admin',
  partners: '/partners',
  resetPassword: '/auth/reset-password',
  authCallback: '/auth/callback',
} as const;

/**
 * Check if current pathname should skip auth initialization
 */
export function shouldSkipAuth(pathname: string | null): boolean {
  if (!pathname) return false;

  return (
    pathname.startsWith(AUTH_EXCLUDED_ROUTES.admin) ||
    pathname.startsWith(AUTH_EXCLUDED_ROUTES.partners) ||
    pathname.startsWith(AUTH_EXCLUDED_ROUTES.resetPassword) ||
    pathname.startsWith(AUTH_EXCLUDED_ROUTES.authCallback)
  );
}

/**
 * Create a timeout promise for database queries
 */
function createQueryTimeout<T>(
  timeoutMs: number,
  errorMessage: string
): Promise<{ data: null; error: { message: string } }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.warn(errorMessage);
      resolve({ data: null, error: { message: 'Query timeout' } });
    }, timeoutMs);
  });
}

/**
 * Fetch customer record with timeout protection
 *
 * @param supabase - Supabase client instance
 * @param userId - Auth user ID to fetch customer for
 * @param timeoutMs - Timeout in milliseconds (default: 10s)
 * @returns Customer data or null
 */
export async function fetchCustomerWithTimeout(
  supabase: SupabaseClient,
  userId: string,
  timeoutMs: number = QUERY_TIMEOUTS.CUSTOMER_FETCH,
  logPrefix: string = '[Auth]'
): Promise<any | null> {
  try {
    console.log(`${logPrefix} Fetching customer record...`);

    const customerQuery = supabase
      .from('customers')
      .select('*')
      .eq('auth_user_id', userId)
      .maybeSingle();

    const timeoutPromise = createQueryTimeout(
      timeoutMs,
      `${logPrefix} Customer database query timed out after ${timeoutMs / 1000} seconds`
    );

    const result = await Promise.race([customerQuery, timeoutPromise]);
    const { data: customerData, error: customerError } = result as any;

    if (customerError) {
      console.error(`${logPrefix} Customer fetch error:`, customerError);
      return null;
    }

    console.log(`${logPrefix} Customer fetched:`, customerData ? 'Found' : 'Not found');
    return customerData;

  } catch (error) {
    console.error(`${logPrefix} Failed to fetch customer:`, error);
    return null;
  }
}

/**
 * Clear all authentication state
 * Utility for resetting auth state on logout or error
 */
export interface AuthState {
  session: any | null;
  user: any | null;
  customer: any | null;
}

export function createClearedAuthState(): AuthState {
  return {
    session: null,
    user: null,
    customer: null,
  };
}

/**
 * Create auth state from session
 */
export async function createAuthStateFromSession(
  supabase: SupabaseClient,
  session: any,
  logPrefix: string = '[Auth]'
): Promise<AuthState> {
  if (!session) {
    console.log(`${logPrefix} No session found`);
    return createClearedAuthState();
  }

  console.log(`${logPrefix} Session found, setting user state...`);

  const customer = await fetchCustomerWithTimeout(
    supabase,
    session.user.id,
    QUERY_TIMEOUTS.CUSTOMER_FETCH,
    logPrefix
  );

  return {
    session,
    user: session.user,
    customer,
  };
}

/**
 * Handle auth state change event
 * Processes Supabase auth state changes and fetches customer data
 */
export async function handleAuthStateChange(
  supabase: SupabaseClient,
  event: string,
  session: any | null,
  logPrefix: string = '[Auth]'
): Promise<AuthState> {
  console.log(`${logPrefix} Auth state changed:`, event);

  if (!session?.user) {
    return createClearedAuthState();
  }

  const customer = await fetchCustomerWithTimeout(
    supabase,
    session.user.id,
    QUERY_TIMEOUTS.CUSTOMER_FETCH,
    logPrefix
  );

  return {
    session,
    user: session.user,
    customer,
  };
}
