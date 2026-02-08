/**
 * Middleware Supabase Client
 *
 * Creates a Supabase client configured for middleware use with proper cookie handling.
 * This client is optimized for edge runtime and handles cookie sync between
 * request and response.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface MiddlewareSupabaseResult {
  supabase: SupabaseClient;
  response: NextResponse;
}

/**
 * Create a Supabase client for middleware with cookie handling
 *
 * @param request - The incoming request
 * @returns Object containing the Supabase client and response
 */
export function createMiddlewareSupabaseClient(
  request: NextRequest
): MiddlewareSupabaseResult {
  // Create initial response with request headers
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          // Step 1: Update request cookies (for server-side reads in this request)
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          // Step 2: Create new response with updated request
          response = NextResponse.next({
            request,
          });

          // Step 3: Set cookies on response (for browser) with options
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  return { supabase, response };
}

/**
 * Get the current response (may have been updated by cookie operations)
 * Note: This is a closure pattern - the response reference is updated by setAll
 */
export function getUpdatedResponse(result: MiddlewareSupabaseResult): NextResponse {
  return result.response;
}
