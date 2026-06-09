'use client';
import { useState } from 'react';
import { step1Schema, type Step1 } from '@/lib/onboarding/schemas';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlacesAddressInput } from '@/app/onboarding/components/PlacesAddressInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const SA_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape',
];

export interface Step1ClinicProps {
  value: Partial<Step1>;
  onChange: (values: Partial<Step1>) => void;
  canGoNext: boolean;
}

export function Step1Clinic({ value, onChange, canGoNext }: Step1ClinicProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (field: keyof Step1, val: string) => {
    const newValue = { ...value, [field]: val };
    onChange(newValue);
    // Validate on change
    const result = step1Schema.safeParse(newValue);
    if (result.success) {
      setErrors((e) => {
        const newE = { ...e };
        delete newE[field];
        return newE;
      });
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Confirm your clinic details
        </h2>
        <p className="text-gray-600">
          These came from your Unjani network record. Check each one and correct
          anything that's changed.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Clinic Name */}
          <div>
            <Label htmlFor="clinicName">
              Clinic name
              <span className="text-red-600">*</span>
            </Label>
            <Input
              id="clinicName"
              type="text"
              placeholder="Unjani Clinic — Lenasia Ext 10"
              value={value.clinicName ?? ''}
              onChange={(e) => handleFieldChange('clinicName', e.target.value)}
              className={errors.clinicName ? 'border-red-600' : ''}
            />
            {errors.clinicName && (
              <p className="text-xs text-red-600 mt-1">{errors.clinicName}</p>
            )}
          </div>

          {/* Province */}
          <div>
            <Label htmlFor="province">
              Province
              <span className="text-red-600">*</span>
            </Label>
            <Select value={value.province ?? ''} onValueChange={(val) => handleFieldChange('province', val)}>
              <SelectTrigger id="province">
                <SelectValue placeholder="Select province" />
              </SelectTrigger>
              <SelectContent>
                {SA_PROVINCES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.province && (
              <p className="text-xs text-red-600 mt-1">{errors.province}</p>
            )}
          </div>

          {/* Contact (nurse-owner) */}
          <div>
            <Label htmlFor="contact">
              Contact (nurse-owner)
              <span className="text-red-600">*</span>
            </Label>
            <Input
              id="contact"
              type="text"
              placeholder="Tsabeng Ramalope"
              value={value.contact ?? ''}
              onChange={(e) => handleFieldChange('contact', e.target.value)}
              className={errors.contact ? 'border-red-600' : ''}
            />
            {errors.contact && (
              <p className="text-xs text-red-600 mt-1">{errors.contact}</p>
            )}
          </div>

          {/* Mobile */}
          <div>
            <Label htmlFor="phone">
              Mobile
              <span className="text-red-600">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="071 898 8722"
              value={value.phone ?? ''}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
              className={errors.phone ? 'border-red-600' : ''}
            />
            {errors.phone && (
              <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">
              Email
              <span className="text-red-600">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="lensext10@unjani.org"
              value={value.email ?? ''}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              className={errors.email ? 'border-red-600' : ''}
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Physical site address - Google Places Autocomplete */}
          <div>
            <Label htmlFor="siteAddress">
              Physical site address
              <span className="text-red-600">*</span>
            </Label>
            <PlacesAddressInput
              value={value.siteAddress ?? ''}
              placeholder="Start typing your clinic name or address…"
              onTextChange={(text) => {
                const newValue = {
                  ...value,
                  siteAddress: text,
                };
                onChange(newValue);
              }}
              onSelect={(data) => {
                const newValue = {
                  ...value,
                  siteAddress: data.address,
                  lat: data.latitude != null ? String(data.latitude) : (value.lat ?? ''),
                  lng: data.longitude != null ? String(data.longitude) : (value.lng ?? ''),
                  province: data.province || value.province,
                };
                onChange(newValue);
                // Validate on change
                const result = step1Schema.safeParse(newValue);
                if (result.success) {
                  setErrors((e) => {
                    const newE = { ...e };
                    delete newE.siteAddress;
                    return newE;
                  });
                }
              }}
            />
            {errors.siteAddress && (
              <p className="text-xs text-red-600 mt-1">{errors.siteAddress}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
