'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePortalAuth } from '@/lib/portal/portal-auth-provider';
import Link from 'next/link';
import {
  PortalModernistShell,
  PageHeader,
  PmButton,
} from '@/components/portal/modernist/PortalModernistShell';
import SiteListTable from '@/components/portal/SiteListTable';

export default function PortalSitesPage() {
  const { user, isSiteUser } = usePortalAuth();
  const router = useRouter();

  useEffect(() => {
    if (isSiteUser && user?.site_id) {
      router.replace(`/unjani/sites/${user.site_id}`);
    }
  }, [isSiteUser, user?.site_id, router]);

  if (!user) return null;

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
        subtitle="Every clinic from nomination through to go-live."
        actions={
          <>
            <Link href="/unjani/coverage">
              <PmButton variant="secondary">Coverage check</PmButton>
            </Link>
            <Link href="/unjani/coverage">
              <PmButton variant="cta">+ Onboard a clinic</PmButton>
            </Link>
          </>
        }
      />
      <SiteListTable />
    </PortalModernistShell>
  );
}
