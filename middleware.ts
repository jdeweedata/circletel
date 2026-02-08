/**
 * Next.js Middleware
 *
 * Handles request processing before reaching route handlers.
 * Responsibilities:
 * 1. Subdomain routing (studio.circletel.co.za -> /admin/cms)
 * 2. Admin route authentication
 *
 * @see middleware/subdomain-handler.ts - Subdomain routing logic
 * @see middleware/admin-auth.ts - Admin authentication logic
 * @see middleware/supabase-client.ts - Supabase client for middleware
 */

import { type NextRequest } from 'next/server';
import { handleSubdomainRouting } from './middleware/subdomain-handler';
import { createMiddlewareSupabaseClient } from './middleware/supabase-client';
import { handleAdminAuth } from './middleware/admin-auth';

export async function middleware(request: NextRequest) {
  // Step 1: Handle subdomain routing
  // Returns early if subdomain rewrite is needed
  const subdomainResponse = handleSubdomainRouting(request);
  if (subdomainResponse) {
    return subdomainResponse;
  }

  // Step 2: Create Supabase client with cookie handling
  const { supabase, response } = createMiddlewareSupabaseClient(request);

  // Step 3: Handle admin route authentication
  const authResult = await handleAdminAuth(request, supabase);
  if (authResult.shouldRedirect && authResult.redirectResponse) {
    return authResult.redirectResponse;
  }

  // Step 4: Return response (with any cookie updates)
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static assets (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
