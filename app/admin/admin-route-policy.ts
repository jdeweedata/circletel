export type AdminRouteMode =
  | 'public'
  | 'full-screen-unguarded'
  | 'full-screen-authenticated'
  | 'standard';

const PUBLIC_ROUTES = [
  '/admin/login',
  '/admin/signup',
  '/admin/forgot-password',
  '/admin/reset-password',
  '/admin/sales/feasibility/designs'
] as const;

const UNGUARDED_FULL_SCREEN_ROUTES = ['/admin/cms/builder'] as const;

const AUTHENTICATED_FULL_SCREEN_ROUTES = ['/admin/operations-preview'] as const;

function isRouteOrDescendant(pathname: string | null, route: string): boolean {
  return pathname === route || pathname?.startsWith(`${route}/`) === true;
}

export function getAdminRouteMode(
  pathname: string | null,
  studio: boolean
): AdminRouteMode {
  if (
    studio ||
    PUBLIC_ROUTES.some((route) => isRouteOrDescendant(pathname, route))
  ) {
    return 'public';
  }

  if (
    UNGUARDED_FULL_SCREEN_ROUTES.some((route) =>
      isRouteOrDescendant(pathname, route)
    )
  ) {
    return 'full-screen-unguarded';
  }

  if (
    AUTHENTICATED_FULL_SCREEN_ROUTES.some((route) =>
      isRouteOrDescendant(pathname, route)
    )
  ) {
    return 'full-screen-authenticated';
  }

  return 'standard';
}
