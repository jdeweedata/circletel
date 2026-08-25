'use client';

import { useRouter } from 'next/navigation';
import {
  PageHeader as PortalPageHeader,
  PmButton,
} from '@/components/portal/modernist/PortalModernistShell';

export function QuotesListHeader() {
  const router = useRouter();

  return (
    <PortalPageHeader
      eyebrow="Sales"
      title="Business Quotes"
      subtitle="Manage and track business quote requests."
      actions={
        <>
          <PmButton variant="secondary" onClick={() => router.push('/admin/quotes/bundles')}>
            Flyers
          </PmButton>
          <PmButton variant="secondary" onClick={() => router.push('/admin/quotes/bundles/new')}>
            Build a quote
          </PmButton>
          <PmButton onClick={() => router.push('/admin/quotes/new')}>New Quote</PmButton>
        </>
      }
    />
  );
}
