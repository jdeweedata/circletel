'use client';

/**
 * Billing Rules Tab Component
 *
 * Configure VAT rate, payment terms, and billing cycles.
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import type { SettingsFormValues } from './FinanceSettingsPage';

interface BillingRulesTabProps {
  values: SettingsFormValues;
  onChange: <K extends keyof SettingsFormValues>(key: K, value: SettingsFormValues[K]) => void;
}

const AVAILABLE_BILLING_DATES = [1, 5, 10, 15, 20, 25, 30] as const;

export function BillingRulesTab({ values, onChange }: BillingRulesTabProps) {
  const handleBillingDateToggle = (date: number, checked: boolean) => {
    const current = values.billing_dates;
    if (checked) {
      onChange('billing_dates', [...current, date].sort((a, b) => a - b));
    } else {
      onChange(
        'billing_dates',
        current.filter((d) => d !== date)
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* VAT Rate */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="vat_rate">VAT Rate (%)</Label>
          <Input
            id="vat_rate"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={values.vat_rate}
            onChange={(e) => onChange('vat_rate', parseFloat(e.target.value) || 0)}
          />
          <p className="text-sm text-muted-foreground">
            South African VAT rate applied to all invoices
          </p>
        </div>
      </div>

      <Separator />

      {/* Payment Terms */}
      <div>
        <h4 className="font-medium text-circleTel-navy mb-4">Payment Terms</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="invoice_due_days">Consumer Invoice Due (days)</Label>
            <Input
              id="invoice_due_days"
              type="number"
              min="1"
              max="90"
              value={values.invoice_due_days}
              onChange={(e) => onChange('invoice_due_days', parseInt(e.target.value) || 7)}
            />
            <p className="text-sm text-muted-foreground">Days until B2C invoices are due</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="b2b_due_days">B2B Invoice Due (days)</Label>
            <Input
              id="b2b_due_days"
              type="number"
              min="1"
              max="90"
              value={values.b2b_due_days}
              onChange={(e) => onChange('b2b_due_days', parseInt(e.target.value) || 30)}
            />
            <p className="text-sm text-muted-foreground">Days until business invoices are due</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grace_period_days">Grace Period (days)</Label>
            <Input
              id="grace_period_days"
              type="number"
              min="0"
              max="30"
              value={values.grace_period_days}
              onChange={(e) => onChange('grace_period_days', parseInt(e.target.value) || 3)}
            />
            <p className="text-sm text-muted-foreground">Days after due before late fees apply</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="auto_suspend_days">Auto-Suspend (days overdue)</Label>
            <Input
              id="auto_suspend_days"
              type="number"
              min="1"
              max="90"
              value={values.auto_suspend_days}
              onChange={(e) => onChange('auto_suspend_days', parseInt(e.target.value) || 14)}
            />
            <p className="text-sm text-muted-foreground">
              Days overdue before automatic service suspension
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Billing Dates */}
      <div>
        <h4 className="font-medium text-circleTel-navy mb-2">Available Billing Dates</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Select which billing dates customers can choose
        </p>
        <div className="flex flex-wrap gap-4">
          {AVAILABLE_BILLING_DATES.map((date) => (
            <div key={date} className="flex items-center space-x-2">
              <Checkbox
                id={`billing_date_${date}`}
                checked={values.billing_dates.includes(date)}
                onCheckedChange={(checked) => handleBillingDateToggle(date, checked === true)}
              />
              <Label htmlFor={`billing_date_${date}`} className="cursor-pointer">
                {date === 1 ? '1st' : `${date}th`}
              </Label>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Current: {values.billing_dates.join(', ')}
        </p>
      </div>
    </div>
  );
}
