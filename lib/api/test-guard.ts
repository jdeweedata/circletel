/**
 * API Test Route Guard
 *
 * Utility to block test API routes in production environment.
 * Used by API routes in /api/*\/test/ directories.
 *
 * @module lib/api/test-guard
 *
 * @example
 * ```typescript
 * import { isTestEnvironment, blockProductionAccess } from '@/lib/api/test-guard';
 *
 * export async function GET(request: NextRequest) {
 *   const blocked = blockProductionAccess();
 *   if (blocked) return blocked;
 *
 *   // Test route logic...
 * }
 * ```
 */

import { NextResponse } from 'next/server';

/**
 * Check if current environment is a test-allowed environment
 */
export function isTestEnvironment(): boolean {
  // Check VERCEL_ENV (set automatically by Vercel)
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === 'production') {
    return false;
  }

  // Check custom APP_URL for production domain
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  if (appUrl.includes('circletel.co.za') && !appUrl.includes('staging')) {
    return false;
  }

  // Allow in development, preview, and staging
  return true;
}

/**
 * Returns a 404 response if called in production
 * Returns null if test access is allowed
 *
 * @example
 * ```typescript
 * const blocked = blockProductionAccess();
 * if (blocked) return blocked;
 * ```
 */
export function blockProductionAccess(): NextResponse | null {
  if (!isTestEnvironment()) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }
  return null;
}

/**
 * Decorator-style higher-order function for test routes
 *
 * @example
 * ```typescript
 * export const GET = withTestGuard(async (request) => {
 *   // Test route logic...
 * });
 * ```
 */
export function withTestGuard<T extends (...args: any[]) => Promise<Response>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    const blocked = blockProductionAccess();
    if (blocked) return blocked;
    return handler(...args);
  }) as T;
}
