/**
 * Finance Settings Page
 *
 * Admin-configurable billing rules, fees, payment methods, and reminder settings.
 * Super Admin access only.
 */

import { Metadata } from 'next';
import { FinanceSettingsPage } from '@/components/admin/settings/finance/FinanceSettingsPage';

export const metadata: Metadata = {
  title: 'Finance Settings - CircleTel Admin',
  description: 'Configure billing rules, fees, payment methods, and reminders',
};

export default function FinanceSettingsRoute() {
  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-circleTel-navy">Finance Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure billing rules, fees, payment methods, and reminder schedules
        </p>
      </div>

      <FinanceSettingsPage />
    </div>
  );
}
