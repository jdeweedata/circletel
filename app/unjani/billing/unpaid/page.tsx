'use client';

import { PortalBillingKpiPage } from '@/components/portal/billing/PortalBillingKpiPage';

export default function UnpaidInvoicesPage() {
  return <PortalBillingKpiPage metric="unpaid" />;
}
