import { redirect } from 'next/navigation';
import { safeUnjaniRedirect } from '@/lib/portal/paths';

/** Old /portal bookmarks → Unjani Connect. */
export default async function LegacyPortalRedirect({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const from = slug?.length ? `/portal/${slug.join('/')}` : '/portal';
  redirect(safeUnjaniRedirect(from));
}
