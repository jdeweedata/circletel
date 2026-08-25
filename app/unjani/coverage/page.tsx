'use client';

import { usePortalAuth } from '@/lib/portal/portal-auth-provider';
import {
  PortalModernistShell,
  PageHeader,
} from '@/components/portal/modernist/PortalModernistShell';
import CoverageExplorer from '@/components/portal/coverage/CoverageExplorer';
import { usePortalCapability } from '@/lib/portal/use-portal-capability';

export default function PortalCoveragePage() {
  const { user } = usePortalAuth();
  const { allowed } = usePortalCapability('coverage.read');

  if (!user || !allowed) return null;

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
