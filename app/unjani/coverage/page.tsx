'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePortalAuth } from '@/lib/portal/portal-auth-provider';
import {
  PortalModernistShell,
  PageHeader,
} from '@/components/portal/modernist/PortalModernistShell';
import CoverageExplorer from '@/components/portal/coverage/CoverageExplorer';

export default function PortalCoveragePage() {
  const { user, isAdmin, loading: authLoading } = usePortalAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) router.replace('/unjani');
  }, [authLoading, isAdmin, router]);

  if (!user || !isAdmin) return null;

  return (
    <PortalModernistShell>
      <PageHeader
        eyebrow="Connectivity · Feasibility"
        title="Coverage check"
        subtitle="See what is available at each clinic — fixed wireless, 5G, or 4G — then nominate a site or check a new address."
      />
      <CoverageExplorer />
    </PortalModernistShell>
  );
}
