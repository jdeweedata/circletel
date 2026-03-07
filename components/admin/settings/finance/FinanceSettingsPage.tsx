'use client';

/**
 * Finance Settings Page Component
 *
 * Tabbed interface for configuring billing settings.
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PiFloppyDiskBold,
  PiWarningCircleBold,
  PiCurrencyDollarBold,
  PiReceiptBold,
  PiBellRingingBold,
} from 'react-icons/pi';
import { UnderlineTabs, TabPanel } from '@/components/admin/shared/UnderlineTabs';
import { SectionCard } from '@/components/admin/shared/SectionCard';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { BillingRulesTab } from './BillingRulesTab';
import { FeesChargesTab } from './FeesChargesTab';
import { RemindersTab } from './RemindersTab';
import type { BillingSetting } from '@/lib/billing/billing-settings-service';

// =============================================================================
// Tab Configuration
// =============================================================================

const TABS = [
  { id: 'billing_rules', label: 'Billing Rules' },
  { id: 'fees_charges', label: 'Fees & Charges' },
  { id: 'reminders', label: 'Reminders' },
] as const;

// =============================================================================
// Types
// =============================================================================

interface SettingsResponse {
  success: boolean;
  data: {
    billing_rules: BillingSetting[];
    fees_charges: BillingSetting[];
    payment_methods: BillingSetting[];
    reminders: BillingSetting[];
    general: BillingSetting[];
  };
  error?: string;
}

export interface SettingsFormValues {
  // Billing Rules
  vat_rate: number;
  invoice_due_days: number;
  b2b_due_days: number;
  grace_period_days: number;
  auto_suspend_days: number;
  billing_dates: number[];

  // Fees & Charges
  late_payment_fee: number;
  reconnection_fee: number;
  router_price: number;
  failed_debit_fee: number;

  // Reminders
  email_reminder_days: number;
  sms_reminder_max: number;
  sms_urgency_thresholds: number[];
  whatsapp_enabled: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function FinanceSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('billing_rules');
  const [formValues, setFormValues] = useState<SettingsFormValues>({
    vat_rate: 15,
    invoice_due_days: 7,
    b2b_due_days: 30,
    grace_period_days: 3,
    auto_suspend_days: 14,
    billing_dates: [1, 5, 25, 30],
    late_payment_fee: 100,
    reconnection_fee: 250,
    router_price: 99,
    failed_debit_fee: 100,
    email_reminder_days: 5,
    sms_reminder_max: 3,
    sms_urgency_thresholds: [3, 7],
    whatsapp_enabled: false,
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch settings
  const { data, isLoading, error } = useQuery<SettingsResponse>({
    queryKey: ['billing-settings'],
    queryFn: async () => {
      const response = await fetch('/api/admin/settings/billing');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch settings');
      }
      return response.json();
    },
  });

  // Initialize form values when data loads
  useEffect(() => {
    if (data?.data) {
      const allSettings = [
        ...data.data.billing_rules,
        ...data.data.fees_charges,
        ...data.data.reminders,
      ];

      const newValues = { ...formValues };
      for (const setting of allSettings) {
        const key = setting.setting_key as keyof SettingsFormValues;
        if (key in newValues) {
          (newValues as Record<string, unknown>)[key] = setting.setting_value;
        }
      }
      setFormValues(newValues);
      setHasChanges(false);
    }
  }, [data]);

  // Update form value
  const updateValue = <K extends keyof SettingsFormValues>(
    key: K,
    value: SettingsFormValues[K]
  ) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Build settings array from changed values
      const settings = Object.entries(formValues).map(([key, value]) => ({
        key,
        value,
      }));

      const response = await fetch('/api/admin/settings/billing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Settings saved',
        description: 'Billing settings have been updated successfully.',
      });
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['billing-settings'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <SectionCard title="Loading">
        <div className="py-8 text-center text-slate-500">Loading settings...</div>
      </SectionCard>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <PiWarningCircleBold className="h-4 w-4" />
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load settings'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <UnderlineTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="mt-6">
        <TabPanel id="billing_rules" activeTab={activeTab}>
          <SectionCard title="Billing Rules" icon={PiReceiptBold}>
            <p className="text-sm text-slate-500 mb-6">
              Configure VAT rate, payment terms, and billing cycles
            </p>
            <BillingRulesTab values={formValues} onChange={updateValue} />
          </SectionCard>
        </TabPanel>

        <TabPanel id="fees_charges" activeTab={activeTab}>
          <SectionCard title="Fees & Charges" icon={PiCurrencyDollarBold}>
            <p className="text-sm text-slate-500 mb-6">
              Configure late fees, reconnection charges, and equipment costs
            </p>
            <FeesChargesTab values={formValues} onChange={updateValue} />
          </SectionCard>
        </TabPanel>

        <TabPanel id="reminders" activeTab={activeTab}>
          <SectionCard title="Reminder Settings" icon={PiBellRingingBold}>
            <p className="text-sm text-slate-500 mb-6">
              Configure email and SMS reminder timing and limits
            </p>
            <RemindersTab values={formValues} onChange={updateValue} />
          </SectionCard>
        </TabPanel>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {hasChanges && (
            <span className="text-amber-600 font-medium">
              You have unsaved changes
            </span>
          )}
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!hasChanges || saveMutation.isPending}
          className="bg-circleTel-orange hover:bg-circleTel-orange/90"
        >
          <PiFloppyDiskBold className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
