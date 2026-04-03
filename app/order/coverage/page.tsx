import { redirect } from 'next/navigation';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Legacy coverage page — redirects to homepage, forwarding query params.
 * Preserves bookmarks, product page links, and marketing email links.
 */
export default async function CoveragePage({ searchParams }: Props) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') qs.set(key, value);
    else if (Array.isArray(value)) qs.set(key, value[0] ?? '');
  }
  const queryString = qs.toString();
  redirect(queryString ? `/?${queryString}` : '/');
}
