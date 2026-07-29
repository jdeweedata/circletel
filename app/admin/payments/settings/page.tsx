'use client';

import { PiGearBold } from 'react-icons/pi';
import {
  AdminPage,
  PageHeader,
  SectionCard,
  EmptyState,
} from '@/components/backend';

export default function PaymentSettingsPage() {
  return (
    <AdminPage>
      <PageHeader
        title="Payment Settings"
        subtitle="Configure payment provider settings"
      />

      <SectionCard title="Provider Configuration">
        <EmptyState
          icon={<PiGearBold />}
          title="Provider Settings"
          description="Coming soon: Configure NetCash, ZOHO Billing, PayFast, and PayGate settings."
        />
      </SectionCard>
    </AdminPage>
  );
}
