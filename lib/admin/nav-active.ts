/**
 * Sidebar active-state matching.
 *
 * Child links that share a path (e.g. /admin/products?section=portfolio)
 * must compare query params. Prefix matching is only for top-level items.
 */

const DISCRIMINATING_KEYS = new Set(['section', 'status', 'view']);

export function isActiveNavHref(
  pathname: string,
  search: string,
  href: string,
  options: { end?: boolean; exactPath?: boolean } = {}
): boolean {
  const qIndex = href.indexOf('?');
  const hrefPath = qIndex === -1 ? href : href.slice(0, qIndex);
  const hrefQuery = qIndex === -1 ? '' : href.slice(qIndex + 1);
  const hrefParams = new URLSearchParams(hrefQuery);
  const currentParams = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);

  const pathMatches = options.end || options.exactPath
    ? pathname === hrefPath
    : pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
  if (!pathMatches) return false;

  for (const [key, value] of hrefParams.entries()) {
    if (currentParams.get(key) !== value) return false;
  }

  if (!hrefQuery) {
    for (const key of DISCRIMINATING_KEYS) {
      const value = currentParams.get(key);
      if (value == null || value === '' || value === 'all') continue;
      if (key === 'section' && value === 'catalogue') continue;
      return false;
    }
  }

  return true;
}
