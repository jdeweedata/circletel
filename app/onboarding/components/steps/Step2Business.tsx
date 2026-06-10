'use client';
import { useState } from 'react';
import { step2Schema, type Step2 } from '@/lib/onboarding/schemas';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PlacesAddressInput } from '@/app/onboarding/components/PlacesAddressInput';

const ENTITY_TYPES = [
  'Private Company (Pty) Ltd',
  'Close Corporation (CC)',
  'Sole Proprietor',
  'Trust',
  'Non-profit (NPC)',
  'Other',
];

export interface Step2BusinessProps {
  value: Partial<Step2>;
  onChange: (values: Partial<Step2>) => void;
  canGoNext: boolean;
}

export function Step2Business({ value, onChange, canGoNext }: Step2BusinessProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (field: keyof Step2, val: string) => {
    const newValue = { ...value, [field]: val };
    onChange(newValue);
    // Validate on change
    const result = step2Schema.safeParse(newValue);
    if (result.success) {
      setErrors((e) => {
        const newE = { ...e };
        delete newE[field];
        return newE;
      });
    }
  };

  const isSoleProp = value.entityType === 'Sole Proprietor';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Your business details
        </h2>
        <p className="text-gray-600">
          The legal entity that will be billed — the names must match the bank account.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Entity Name */}
          <div>
            <Label htmlFor="entityName">
              Entity name<span className="text-red-600">*</span>
            </Label>
            <Input
              id="entityName"
              type="text"
              placeholder="e.g. Lens Ext 10 (Pty) Ltd"
              value={value.entityName ?? ''}
              onChange={(e) => handleFieldChange('entityName', e.target.value)}
              className={errors.entityName ? 'border-red-600' : ''}
            />
            {errors.entityName && (
              <p className="text-xs text-red-600 mt-1">{errors.entityName}</p>
            )}
          </div>

          {/* Entity Type */}
          <div>
            <Label htmlFor="entityType">
              Entity type<span className="text-red-600">*</span>
            </Label>
            <Select
              value={value.entityType ?? ''}
              onValueChange={(val) => handleFieldChange('entityType', val)}
            >
              <SelectTrigger id="entityType">
                <SelectValue placeholder="Select entity type" />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.entityType && (
              <p className="text-xs text-red-600 mt-1">{errors.entityType}</p>
            )}
          </div>

          {/* Registration Number / Owner ID */}
          <div>
            <Label htmlFor="regNumber">
              {isSoleProp ? (
                <>
                  Owner ID number<span className="text-red-600">*</span>
                </>
              ) : (
                <>
                  Registration number<span className="text-red-600">*</span>
                </>
              )}
            </Label>
            <Input
              id="regNumber"
              type="text"
              placeholder={isSoleProp ? '13-digit SA ID number' : 'CIPC registration'}
              value={value.regNumber ?? ''}
              onChange={(e) => handleFieldChange('regNumber', e.target.value)}
              className={errors.regNumber ? 'border-red-600' : ''}
            />
            {errors.regNumber && (
              <p className="text-xs text-red-600 mt-1">{errors.regNumber}</p>
            )}
          </div>

          {/* VAT Registration */}
          <div>
            <Label>
              VAT registered?<span className="text-red-600">*</span>
            </Label>
            <RadioGroup
              value={value.vat ?? 'No'}
              onValueChange={(val) => {
                handleFieldChange('vat', val);
                if (val === 'No') {
                  handleFieldChange('vatNumber', '');
                }
              }}
              className="flex gap-6 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="No" id="vat-no" />
                <Label htmlFor="vat-no">No</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Yes" id="vat-yes" />
                <Label htmlFor="vat-yes">Yes</Label>
              </div>
            </RadioGroup>
          </div>

          {/* VAT Number (conditional) */}
          {value.vat === 'Yes' && (
            <div>
              <Label htmlFor="vatNumber">
                VAT number<span className="text-red-600">*</span>
              </Label>
              <Input
                id="vatNumber"
                type="text"
                placeholder="e.g. 4123456789"
                value={value.vatNumber ?? ''}
                onChange={(e) => handleFieldChange('vatNumber', e.target.value)}
                className={errors.vatNumber ? 'border-red-600' : ''}
              />
              {errors.vatNumber && (
                <p className="text-xs text-red-600 mt-1">{errors.vatNumber}</p>
              )}
            </div>
          )}

          {/* Registration Address */}
          <div>
            <Label htmlFor="regAddress">
              Registered address<span className="text-red-600">*</span>
            </Label>
            <PlacesAddressInput
              value={value.regAddress ?? ''}
              placeholder="Start typing the registered address…"
              onTextChange={(text) => handleFieldChange('regAddress', text)}
              onSelect={(data) => handleFieldChange('regAddress', data.address)}
            />
            {errors.regAddress && (
              <p className="text-xs text-red-600 mt-1">{errors.regAddress}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
