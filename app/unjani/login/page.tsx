import { redirect } from 'next/navigation';
import { safeUnjaniRedirect } from '@/lib/portal/paths';

/**
 * Unjani Connect login — unified into /auth/login (Unjani tab).
 */
export default async function UnjaniLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams({ account: 'unjani' });
  if (params.redirect) qs.set('redirect', safeUnjaniRedirect(params.redirect));
  if (params.error) qs.set('error', params.error);
  redirect(`/auth/login?${qs.toString()}`);
}
