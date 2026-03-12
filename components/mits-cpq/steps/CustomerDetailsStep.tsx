'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, CheckCircle, XCircle } from 'lucide-react';
import type { MITSCustomerData } from '@/lib/mits-cpq/types';

interface CustomerDetailsStepProps {
  data: MITSCustomerData | undefined;
  onUpdate: (data: MITSCustomerData) => void;
}

type CoverageStatus = 'idle' | 'checking' | 'covered' | 'not_covered';

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

export function CustomerDetailsStep({ data, onUpdate }: CustomerDetailsStepProps) {
  const [formData, setFormData] = useState<MITSCustomerData>({
    company_name: data?.company_name ?? '',
    registration_number: data?.registration_number ?? '',
    vat_number: data?.vat_number ?? '',
    industry: data?.industry ?? '',
    billing_address: data?.billing_address ?? '',
    city: data?.city ?? '',
    province: data?.province ?? '',
    postal_code: data?.postal_code ?? '',
    contact_name: data?.contact_name ?? '',
    contact_email: data?.contact_email ?? '',
    contact_phone: data?.contact_phone ?? '',
    coverage_checked: data?.coverage_checked ?? false,
    notes: data?.notes ?? '',
  });

  const [coverageStatus, setCoverageStatus] = useState<CoverageStatus>(
    data?.coverage_checked ? 'covered' : 'idle'
  );

  // Propagate form state up on change
  useEffect(() => {
    onUpdate(formData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const handleChange = (field: keyof MITSCustomerData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckCoverage = () => {
    if (!formData.billing_address || !formData.city) return;

    setCoverageStatus('checking');

    // Simulate coverage check with a 1.5s delay and random result
    setTimeout(() => {
      const covered = Math.random() > 0.3; // 70% chance of coverage
      setCoverageStatus(covered ? 'covered' : 'not_covered');
      setFormData((prev) => ({ ...prev, coverage_checked: covered }));
    }, 1500);
  };

  return (
    <div className="space-y-8">
      {/* Company Details */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-slate-900">Company Information</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="company-name">
              Company Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="company-name"
              placeholder="Acme (Pty) Ltd"
              value={formData.company_name}
              onChange={(e) => handleChange('company_name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="registration-number">Registration Number</Label>
            <Input
              id="registration-number"
              placeholder="2024/123456/07"
              value={formData.registration_number ?? ''}
              onChange={(e) => handleChange('registration_number', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vat-number">VAT Number</Label>
            <Input
              id="vat-number"
              placeholder="4123456789"
              value={formData.vat_number ?? ''}
              onChange={(e) => handleChange('vat_number', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              placeholder="e.g. Professional Services"
              value={formData.industry ?? ''}
              onChange={(e) => handleChange('industry', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Primary Contact */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-slate-900">Primary Contact</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="contact-name">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contact-name"
              placeholder="Jane Smith"
              value={formData.contact_name}
              onChange={(e) => handleChange('contact_name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contact-email"
              type="email"
              placeholder="jane@company.co.za"
              value={formData.contact_email}
              onChange={(e) => handleChange('contact_email', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-phone">
              Phone <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contact-phone"
              type="tel"
              placeholder="082 123 4567"
              value={formData.contact_phone}
              onChange={(e) => handleChange('contact_phone', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Service Address */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-slate-900">Service Address</h3>
        <p className="text-sm text-slate-600">
          The physical address where the MITS solution will be installed.
        </p>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="street-address">
              Street Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="street-address"
              placeholder="123 Main Road, Office Park"
              value={formData.billing_address}
              onChange={(e) => handleChange('billing_address', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">
                City <span className="text-red-500">*</span>
              </Label>
              <Input
                id="city"
                placeholder="Johannesburg"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="province">Province</Label>
              <select
                id="province"
                value={formData.province}
                onChange={(e) => handleChange('province', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select province</option>
                {SA_PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal-code">Postal Code</Label>
              <Input
                id="postal-code"
                placeholder="2001"
                value={formData.postal_code}
                onChange={(e) => handleChange('postal_code', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Coverage Check */}
        <div className="flex items-center gap-4 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCheckCoverage}
            disabled={!formData.billing_address || !formData.city || coverageStatus === 'checking'}
            className="flex items-center gap-2"
          >
            <MapPin className="h-4 w-4" />
            {coverageStatus === 'checking' ? 'Checking Coverage...' : 'Check Coverage'}
          </Button>

          {coverageStatus === 'covered' && (
            <div className="flex items-center gap-2 text-sm font-medium text-green-700">
              <CheckCircle className="h-4 w-4" />
              Address is covered — SkyFibre available
            </div>
          )}

          {coverageStatus === 'not_covered' && (
            <div className="flex items-center gap-2 text-sm font-medium text-red-600">
              <XCircle className="h-4 w-4" />
              Address not currently covered — LTE/5G fallback available
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes</Label>
        <textarea
          id="notes"
          rows={3}
          placeholder="Any special requirements, site access details, or notes for the installation team..."
          value={formData.notes ?? ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
    </div>
  );
}
