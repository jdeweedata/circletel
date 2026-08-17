'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePortalAuth } from '@/lib/portal/portal-auth-provider';
import { usePortalApp } from '@/lib/portal/portal-app-context';
import Link from 'next/link';
import {
  PortalModernistShell,
  PageHeader,
  PmButton,
} from '@/components/portal/modernist/PortalModernistShell';
import SiteListTable from '@/components/portal/SiteListTable';
import { usePortalCapability } from '@/lib/portal/use-portal-capability';

export default function PortalSitesPage() {
  const { user, isSiteUser } = usePortalAuth();
  const { href, isUnjani } = usePortalApp();
  const { allowed } = usePortalCapability('sites.read');
  const router = useRouter();

  useEffect(() => {
    if (isSiteUser && user?.site_id) {
      router.replace(href(`/sites/${user.site_id}`));
    }
  }, [isSiteUser, user?.site_id, router, href]);

  if (!user || !allowed) return null;

  if (isSiteUser) {
    return (
      <div className="py-20 text-center text-sm" style={{ color: '#13274A' }}>
        Loading your site…
      </div>
    );
  }

  return (
    <PortalModernistShell>
      <PageHeader
        eyebrow={`${user.organisation_name} · Network`}
        title="Sites"
        subtitle={
          isUnjani
            ? 'Every clinic from nomination through to go-live.'
            : 'Every site on the account.'
        }
        actions={
          isUnjani ? (
            <>
              <Link href={href('/coverage')}>
                <PmButton variant="secondary">Coverage check</PmButton>
              </Link>
              <Link href={href('/coverage')}>
                <PmButton variant="cta">+ Onboard a clinic</PmButton>
              </Link>
            </>
          ) : undefined
        }
      />
      <SiteListTable />
    </PortalModernistShell>
  );
}
