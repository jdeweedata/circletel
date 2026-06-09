'use client';
import { useState } from 'react';
import { step3Schema, type Step3 } from '@/lib/onboarding/schemas';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PiWarningCircle } from 'react-icons/pi';

const BANKS = [
  'Absa',
  'Capitec',
  'FNB',
  'Investec',
  'Nedbank',
  'Standard Bank',
  'TymeBank',
  'Other',
];

const ACCOUNT_TYPES = [
  'Cheque / Current',
  'Savings',
  'Transmission',
];

export interface Step3BankingProps {
  value: Partial<Step3>;
  onChange: (values: Partial<Step3>) => void;
  step2EntityName?: string;
  canGoNext: boolean;
}

export function Step3Banking({
  value,
  onChange,
  step2EntityName = '',
  canGoNext,
}: Step3BankingProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (field: keyof Step3, val: string | boolean) => {
    const newValue = { ...value, [field]: val };
    onChange(newValue);
    // Validate on change
    const result = step3Schema.safeParse(newValue);
    if (result.success) {
      setErrors((e) => {
        const newE = { ...e };
        delete newE[field];
        return newE;
      });
    }
  };

  // Check if account holder matches entity name (case-insensitive, trimmed)
  const holderTrimmed = (value.accHolder ?? '').trim().toLowerCase();
  const entityTrimmed = (step2EntityName ?? '').trim().toLowerCase();
  const nameMatch = holderTrimmed.length > 0 && holderTrimmed === entityTrimmed;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Banking details
        </h2>
        <p className="text-gray-600">
          We'll set up a monthly DebiCheck debit order on your chosen payment date.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Account Holder */}
          <div>
            <Label htmlFor="accHolder">
              Account holder name<span className="text-red-600">*</span>
            </Label>
            <Input
              id="accHolder"
              type="text"
              placeholder="As it appears on your bank account"
              value={value.accHolder ?? ''}
              onChange={(e) => handleFieldChange('accHolder', e.target.value)}
              className={errors.accHolder ? 'border-red-600' : ''}
            />
            {errors.accHolder && (
              <p className="text-xs text-red-600 mt-1">{errors.accHolder}</p>
            )}
          </div>

          {/* Name mismatch warning */}
          {!nameMatch && holderTrimmed.length > 0 && entityTrimmed.length > 0 && (
            <div className="flex gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <PiWarningCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                <strong>Account holder should match your registered entity</strong> —
                name mismatches are the main cause of mandate rejection.
              </p>
            </div>
          )}

          {/* Bank */}
          <div>
            <Label htmlFor="bank">
              Bank<span className="text-red-600">*</span>
            </Label>
            <Select
              value={value.bank ?? ''}
              onValueChange={(val) => handleFieldChange('bank', val)}
            >
              <SelectTrigger id="bank">
                <SelectValue placeholder="Select your bank" />
              </SelectTrigger>
              <SelectContent>
                {BANKS.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.bank && (
              <p className="text-xs text-red-600 mt-1">{errors.bank}</p>
            )}
          </div>

          {/* Account Type */}
          <div>
            <Label htmlFor="accType">
              Account type<span className="text-red-600">*</span>
            </Label>
            <Select
              value={value.accType ?? ''}
              onValueChange={(val) => handleFieldChange('accType', val)}
            >
              <SelectTrigger id="accType">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.accType && (
              <p className="text-xs text-red-600 mt-1">{errors.accType}</p>
            )}
          </div>

          {/* Account Number */}
          <div>
            <Label htmlFor="accNumber">
              Account number<span className="text-red-600">*</span>
            </Label>
            <Input
              id="accNumber"
              type="text"
              placeholder="Your bank account number"
              value={value.accNumber ?? ''}
              onChange={(e) => handleFieldChange('accNumber', e.target.value)}
              className={errors.accNumber ? 'border-red-600' : ''}
            />
            {errors.accNumber && (
              <p className="text-xs text-red-600 mt-1">{errors.accNumber}</p>
            )}
          </div>

          {/* Branch Code */}
          <div>
            <Label htmlFor="branchCode">
              Branch code<span className="text-red-600">*</span>
            </Label>
            <Input
              id="branchCode"
              type="text"
              placeholder="e.g. 470010"
              value={value.branchCode ?? ''}
              onChange={(e) => handleFieldChange('branchCode', e.target.value)}
              className={errors.branchCode ? 'border-red-600' : ''}
            />
            {errors.branchCode && (
              <p className="text-xs text-red-600 mt-1">{errors.branchCode}</p>
            )}
          </div>

          {/* DebiCheck Consent */}
          <div className="flex items-start gap-3 p-3 border border-gray-200 rounded bg-gray-50">
            <Checkbox
              id="mandate"
              checked={value.mandate ?? false}
              onCheckedChange={(checked) =>
                handleFieldChange('mandate', checked as boolean)
              }
            />
            <label htmlFor="mandate" className="text-sm cursor-pointer">
              <span className="font-semibold">I authorise CircleTel</span> to set up a
              monthly DebiCheck debit order on my account, in accordance with the
              DebiCheck rules, and I understand this is one-time authorisation for
              recurring debits.
            </label>
          </div>
          {errors.mandate && (
            <p className="text-xs text-red-600">{errors.mandate}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
