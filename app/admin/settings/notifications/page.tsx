/**
 * CircleTel Admin - Notification Preferences Page
 *
 * Allows admin users to configure their notification preferences
 */

import { NotificationPreferences } from '@/components/admin/notifications/NotificationPreferences';

export default function NotificationSettingsPage() {
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-circleTel-darkNeutral">
          Notification Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure how you want to receive notifications about important events
        </p>
      </div>

      <NotificationPreferences />
    </div>
  );
}
