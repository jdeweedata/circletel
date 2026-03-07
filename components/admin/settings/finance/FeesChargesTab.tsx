'use client';

/**
 * Fees & Charges Tab Component
 *
 * Configure late fees, reconnection charges, and equipment costs.
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SettingsFormValues } from './FinanceSettingsPage';

interface FeesChargesTabProps {
  values: SettingsFormValues;
  onChange: <K extends keyof SettingsFormValues>(key: K, value: SettingsFormValues[K]) => void;
}

export function FeesChargesTab({ values, onChange }: FeesChargesTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Late Payment Fee */}
        <div className="space-y-2">
          <Label htmlFor="late_payment_fee">Late Payment Fee (R)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              R
            </span>
            <Input
              id="late_payment_fee"
              type="number"
              step="0.01"
              min="0"
              className="pl-8"
              value={values.late_payment_fee}
              onChange={(e) => onChange('late_payment_fee', parseFloat(e.target.value) || 0)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Fee charged when payment is received after grace period
          </p>
        </div>

        {/* Failed Debit Fee */}
        <div className="space-y-2">
          <Label htmlFor="failed_debit_fee">Failed Debit Order Fee (R)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              R
            </span>
            <Input
              id="failed_debit_fee"
              type="number"
              step="0.01"
              min="0"
              className="pl-8"
              value={values.failed_debit_fee}
              onChange={(e) => onChange('failed_debit_fee', parseFloat(e.target.value) || 0)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Fee charged when a debit order fails (insufficient funds, etc.)
          </p>
        </div>

        {/* Reconnection Fee */}
        <div className="space-y-2">
          <Label htmlFor="reconnection_fee">Reconnection Fee (R)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              R
            </span>
            <Input
              id="reconnection_fee"
              type="number"
              step="0.01"
              min="0"
              className="pl-8"
              value={values.reconnection_fee}
              onChange={(e) => onChange('reconnection_fee', parseFloat(e.target.value) || 0)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Fee charged to reconnect service after suspension
          </p>
        </div>

        {/* Router Price */}
        <div className="space-y-2">
          <Label htmlFor="router_price">Router Price (R)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              R
            </span>
            <Input
              id="router_price"
              type="number"
              step="0.01"
              min="0"
              className="pl-8"
              value={values.router_price}
              onChange={(e) => onChange('router_price', parseFloat(e.target.value) || 0)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Router rental/purchase price added to installation invoices
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-1">Note</h4>
        <p className="text-sm text-blue-800">
          Changes to fees will apply to new invoices only. Existing invoices will not be affected.
        </p>
      </div>
    </div>
  );
}
