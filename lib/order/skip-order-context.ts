/**
 * Consumer order wizard should not run on CRM / partner / portal shells.
 * Unjani coverage was hitting GET/PUT /api/order-drafts for portal logins.
 */
export function shouldSkipOrderContext(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/partners') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/unjani') ||
    pathname.startsWith('/portal')
  );
}
