import { redirect } from 'next/navigation';
import { safeBusinessRedirect } from '@/lib/portal/paths';

/**
 * Generic business login — unified into /auth/login (Business tab).
 */
export default async function PortalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams({ account: 'business' });
  if (params.redirect) {
    qs.set('redirect', safeBusinessRedirect(params.redirect, null));
  }
  if (params.error) qs.set('error', params.error);
  redirect(`/auth/login?${qs.toString()}`);
}
