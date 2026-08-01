'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ReportPeriodPreset } from '@/lib/usage-reports/types';

export interface CustomPeriodValue {
  startDate: string;
  endDate: string;
}

interface PeriodPickerProps {
  value: ReportPeriodPreset;
  custom: CustomPeriodValue;
  onChange: (value: ReportPeriodPreset) => void;
  onCustomChange: (value: CustomPeriodValue) => void;
}

const PERIOD_OPTIONS: Array<{
  value: ReportPeriodPreset;
  label: string;
  description: string;
}> = [
  {
    value: 'weekly',
    label: 'Last complete week',
    description: 'Monday through Sunday',
  },
  {
    value: 'monthly',
    label: 'Previous month',
    description: 'Last complete calendar month',
  },
  {
    value: 'sixty_day',
    label: 'Last 60 days',
    description: 'Through yesterday',
  },
  {
    value: 'custom',
    label: 'Custom range',
    description: 'Up to 90 inclusive days',
  },
];

export function isCustomPeriod(value: ReportPeriodPreset): boolean {
  return value === 'custom';
}

export function PeriodPicker({
  value,
  custom,
  onChange,
  onCustomChange,
}: PeriodPickerProps) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-semibold text-slate-900">Report period</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {PERIOD_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
              value === option.value
                ? 'border-orange-400 bg-orange-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <input
              type="radio"
              name="usage-report-period"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="mt-1 accent-orange-600"
            />
            <span>
              <span className="block text-sm font-medium text-slate-900">
                {option.label}
              </span>
              <span className="block text-xs text-slate-500">{option.description}</span>
            </span>
          </label>
        ))}
      </div>

      {isCustomPeriod(value) && (
        <div className="grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="usage-report-start">Start date</Label>
            <Input
              id="usage-report-start"
              type="date"
              value={custom.startDate}
              onChange={(event) =>
                onCustomChange({ ...custom, startDate: event.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="usage-report-end">End date</Label>
            <Input
              id="usage-report-end"
              type="date"
              value={custom.endDate}
              onChange={(event) =>
                onCustomChange({ ...custom, endDate: event.target.value })
              }
            />
          </div>
        </div>
      )}
    </fieldset>
  );
}
