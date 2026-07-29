/**
 * CircleTel Admin - Notification Preferences Page
 *
 * Allows admin users to configure their notification preferences
 */

import { NotificationPreferences } from '@/components/admin/notifications/NotificationPreferences';

import {
  AdminPage,
  PageHeader,
  StatCard,
  SectionCard,
  StatusBadge,
  LoadingState,
  EmptyState,
  ErrorState,
  type StatusVariant,
} from '@/components/backend';


export default function NotificationSettingsPage() {
  return (
    <AdminPage>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-circleTel-navy">
          Notification Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure how you want to receive notifications about important events
        </p>
      </div>

      <NotificationPreferences />
    </AdminPage>
  );
}
