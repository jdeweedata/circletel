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
import { handlePortalAuth } from './middleware/portal-auth';
import { handleAmbassadorAuth } from './middleware/ambassador-auth';

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
  const adminAuthResult = await handleAdminAuth(request, supabase);
  if (adminAuthResult.shouldRedirect && adminAuthResult.redirectResponse) {
    return adminAuthResult.redirectResponse;
  }

  // Step 3.5: Handle B2B portal route authentication
  const portalAuthResult = await handlePortalAuth(request, supabase);
  if (portalAuthResult.shouldRedirect && portalAuthResult.redirectResponse) {
    return portalAuthResult.redirectResponse;
  }

  // Step 4: Handle ambassador route authentication
  const ambassadorAuthResult = await handleAmbassadorAuth(request, supabase);
  if (ambassadorAuthResult.shouldRedirect && ambassadorAuthResult.redirectResponse) {
    return ambassadorAuthResult.redirectResponse;
  }

  // Step 5: Return response (with any cookie updates)
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
