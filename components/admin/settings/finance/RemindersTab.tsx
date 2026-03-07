'use client';

/**
 * Reminders Tab Component
 *
 * Configure email and SMS reminder timing and limits.
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import type { SettingsFormValues } from './FinanceSettingsPage';

interface RemindersTabProps {
  values: SettingsFormValues;
  onChange: <K extends keyof SettingsFormValues>(key: K, value: SettingsFormValues[K]) => void;
}

export function RemindersTab({ values, onChange }: RemindersTabProps) {
  const handleUrgencyThresholdChange = (index: number, value: number) => {
    const newThresholds = [...values.sms_urgency_thresholds];
    newThresholds[index] = value;
    onChange('sms_urgency_thresholds', newThresholds.sort((a, b) => a - b));
  };

  return (
    <div className="space-y-6">
      {/* Email Reminders */}
      <div>
        <h4 className="font-medium text-circleTel-navy mb-4">Email Reminders</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email_reminder_days">Days Before Due</Label>
            <Input
              id="email_reminder_days"
              type="number"
              min="1"
              max="30"
              value={values.email_reminder_days}
              onChange={(e) => onChange('email_reminder_days', parseInt(e.target.value) || 5)}
            />
            <p className="text-sm text-muted-foreground">
              Send email reminder this many days before invoice is due
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* SMS Reminders */}
      <div>
        <h4 className="font-medium text-circleTel-navy mb-4">SMS Reminders</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sms_reminder_max">Maximum SMS Reminders</Label>
            <Input
              id="sms_reminder_max"
              type="number"
              min="1"
              max="10"
              value={values.sms_reminder_max}
              onChange={(e) => onChange('sms_reminder_max', parseInt(e.target.value) || 3)}
            />
            <p className="text-sm text-muted-foreground">
              Maximum number of SMS reminders per overdue invoice
            </p>
          </div>
        </div>

        <div className="mt-4">
          <Label className="mb-2 block">Urgency Escalation Thresholds (days overdue)</Label>
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <Label htmlFor="urgency_1" className="text-sm text-muted-foreground">
                Standard → Urgent
              </Label>
              <Input
                id="urgency_1"
                type="number"
                min="1"
                max="30"
                className="w-24"
                value={values.sms_urgency_thresholds[0] || 3}
                onChange={(e) => handleUrgencyThresholdChange(0, parseInt(e.target.value) || 3)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="urgency_2" className="text-sm text-muted-foreground">
                Urgent → Final
              </Label>
              <Input
                id="urgency_2"
                type="number"
                min="1"
                max="30"
                className="w-24"
                value={values.sms_urgency_thresholds[1] || 7}
                onChange={(e) => handleUrgencyThresholdChange(1, parseInt(e.target.value) || 7)}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Days overdue when SMS tone escalates to more urgent messaging
          </p>
        </div>
      </div>

      <Separator />

      {/* WhatsApp */}
      <div>
        <h4 className="font-medium text-circleTel-navy mb-4">WhatsApp Reminders</h4>
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <Label htmlFor="whatsapp_enabled" className="font-medium">
              Enable WhatsApp Reminders
            </Label>
            <p className="text-sm text-muted-foreground">
              Send payment reminders via WhatsApp in addition to SMS
            </p>
          </div>
          <Switch
            id="whatsapp_enabled"
            checked={values.whatsapp_enabled}
            onCheckedChange={(checked) => onChange('whatsapp_enabled', checked)}
          />
        </div>
        {values.whatsapp_enabled && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
            <h4 className="font-medium text-amber-900 mb-1">Configuration Required</h4>
            <p className="text-sm text-amber-800">
              WhatsApp Business API must be configured in Integrations before this feature will
              work.
            </p>
          </div>
        )}
      </div>

      {/* SMS Templates Info */}
      <div className="bg-gray-50 border rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">SMS Template Previews</h4>
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium text-green-700">Standard (1-3 days):</span>
            <p className="text-gray-600">
              "Hi [Name], your CircleTel invoice [INV] for R[Amount] is [X] day(s) overdue..."
            </p>
          </div>
          <div>
            <span className="font-medium text-amber-700">Urgent (4-7 days):</span>
            <p className="text-gray-600">
              "URGENT: [Name], invoice [INV] (R[Amount]) is [X] days overdue. Service may be
              suspended..."
            </p>
          </div>
          <div>
            <span className="font-medium text-red-700">Final (8+ days):</span>
            <p className="text-gray-600">
              "FINAL NOTICE: [Name], invoice [INV] (R[Amount]) is [X] days overdue. Pay
              immediately..."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
