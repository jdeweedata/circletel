/**
 * Finance Settings Page
 *
 * Admin-configurable billing rules, fees, payment methods, and reminder settings.
 * Super Admin access only.
 */

import { Metadata } from 'next';
import { FinanceSettingsPage } from '@/components/admin/settings/finance/FinanceSettingsPage';
import { DetailPageHeader } from '@/components/admin/shared/DetailPageHeader';

export const metadata: Metadata = {
  title: 'Finance Settings - CircleTel Admin',
  description: 'Configure billing rules, fees, payment methods, and reminders',
};

export default function FinanceSettingsRoute() {
  return (
    <div className="min-h-screen bg-slate-50">
      <DetailPageHeader
        breadcrumbs={[
          { label: 'Settings', href: '/admin/settings' },
          { label: 'Finance Settings' },
        ]}
        title="Finance Settings"
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <FinanceSettingsPage />
      </main>
    </div>
  );
}
