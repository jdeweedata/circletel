/**
 * Subdomain Handler
 *
 * Handles subdomain-based routing for CircleTel.
 * Currently supports: studio.circletel.co.za -> /admin/cms
 */

import { NextResponse, type NextRequest } from 'next/server';


interface SubdomainConfig {
  prefix: string;
  rewriteTo: string;
}

/**
 * Subdomain routing configuration
 * Add new subdomains here as needed
 */
const SUBDOMAIN_ROUTES: SubdomainConfig[] = [
  { prefix: 'studio.', rewriteTo: '/admin/cms' },
];

/**
 * Paths that should never be rewritten (static assets, API routes, etc.)
 */
const SKIP_REWRITE_PATHS = [
  '/api/',
  '/_next/',
  '/static/',
];

/**
 * Check if a path should skip subdomain rewriting
 */
function shouldSkipRewrite(pathname: string, rewriteTo: string): boolean {
  // Skip if already on the target path
  if (pathname.startsWith(rewriteTo)) {
    return true;
  }

  // Skip for protected paths
  return SKIP_REWRITE_PATHS.some(path => pathname.startsWith(path));
}

/**
 * Handle subdomain routing
 *
 * @param request - The incoming request
 * @returns NextResponse if rewrite needed, null otherwise
 */
export function handleSubdomainRouting(request: NextRequest): NextResponse | null {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';

  // Find matching subdomain configuration
  const matchedSubdomain = SUBDOMAIN_ROUTES.find(config =>
    hostname.startsWith(config.prefix)
  );

  if (!matchedSubdomain) {
    return null; // No subdomain match, continue normal processing
  }

  // Check if we should skip rewriting this path
  if (shouldSkipRewrite(url.pathname, matchedSubdomain.rewriteTo)) {
    return null;
  }

  // Rewrite the URL to the target path
  const newPath = url.pathname === '/'
    ? matchedSubdomain.rewriteTo
    : `${matchedSubdomain.rewriteTo}${url.pathname}`;

  // console.log('Subdomain rewrite', {
  //   hostname,
  //   originalPath: url.pathname,
  //   newPath,
  // });

  url.pathname = newPath;
  return NextResponse.rewrite(url);
}

/**
 * Check if the current request is from a known subdomain
 */
export function isSubdomainRequest(request: NextRequest): boolean {
  const hostname = request.headers.get('host') || '';
  return SUBDOMAIN_ROUTES.some(config => hostname.startsWith(config.prefix));
}
