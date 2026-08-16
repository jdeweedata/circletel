'use client';

import { PortalBillingKpiPage } from '@/components/portal/billing/PortalBillingKpiPage';

export default function PaidInvoicesPage() {
  return <PortalBillingKpiPage metric="paid" />;
}
