import { redirect } from 'next/navigation';

/**
 * Legacy B2B portal login — unified into /auth/login (Business tab).
 * Preserves redirect query when present.
 */
export default async function PortalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams({ account: 'business' });
  if (params.redirect) qs.set('redirect', params.redirect);
  if (params.error) qs.set('error', params.error);
  redirect(`/auth/login?${qs.toString()}`);
}
