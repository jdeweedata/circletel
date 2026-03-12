'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useMITSTiers } from '@/lib/mits-cpq/hooks';
import type { MITSM365ConfigData } from '@/lib/mits-cpq/types';

interface M365ConfigStepProps {
  tierCode: string;
  data: MITSM365ConfigData | undefined;
  onUpdate: (data: MITSM365ConfigData) => void;
}

export function M365ConfigStep({ tierCode, data, onUpdate }: M365ConfigStepProps) {
  const { tiers, loading } = useMITSTiers();

  const [additionalLicences, setAdditionalLicences] = useState<number>(
    data?.additional_licences ?? 0
  );
  const [domain, setDomain] = useState<string>(data?.domain ?? '');
  const [hasExistingTenant, setHasExistingTenant] = useState<boolean>(
    data?.existing_tenant ?? false
  );

  // Propagate state up on every change
  useEffect(() => {
    onUpdate({
      additional_licences: additionalLicences,
      domain: domain || undefined,
      existing_tenant: hasExistingTenant,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [additionalLicences, domain, hasExistingTenant]);

  const selectedTier = tiers.find((t) => t.tier_code === tierCode);

  const handleAdditionalLicencesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(0, parseInt(e.target.value, 10) || 0);
    setAdditionalLicences(val);
  };

  return (
    <div className="space-y-8">
      {/* Included Licences Info */}
      {!loading && selectedTier && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-500">
              <span className="text-xs font-bold text-white">i</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">
                M365 Licences Included in {selectedTier.tier_name}
              </p>
              <p className="mt-1 text-sm text-blue-800">
                Your selected tier includes{' '}
                <strong>{selectedTier.m365_included_licences} {selectedTier.m365_licence_type}</strong>{' '}
                licence{selectedTier.m365_included_licences !== 1 ? 's' : ''} at no additional cost.
                Additional licences are billed at{' '}
                <strong>
                  R{selectedTier.m365_additional_rate.toLocaleString('en-ZA', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}/licence/month
                </strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
          Loading tier information...
        </div>
      )}

      {/* Additional Licences */}
      <div className="space-y-2">
        <Label htmlFor="additional-licences" className="text-base font-semibold text-slate-900">
          Additional M365 Licences
        </Label>
        <p className="text-sm text-slate-600">
          How many additional licences does this customer need beyond what is included in their tier?
        </p>
        <div className="flex items-center gap-4">
          <Input
            id="additional-licences"
            type="number"
            min={0}
            value={additionalLicences}
            onChange={handleAdditionalLicencesChange}
            className="w-32"
          />
          <span className="text-sm text-slate-600">additional licences</span>
        </div>
        {selectedTier && additionalLicences > 0 && (
          <p className="text-sm text-orange font-medium">
            Additional cost:{' '}
            R{(additionalLicences * selectedTier.m365_additional_rate).toLocaleString('en-ZA', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}/month
          </p>
        )}
      </div>

      {/* Primary Domain */}
      <div className="space-y-2">
        <Label htmlFor="primary-domain" className="text-base font-semibold text-slate-900">
          Primary M365 Domain
        </Label>
        <p className="text-sm text-slate-600">
          Enter the customer&apos;s primary domain (e.g. company.co.za). Used for M365 tenant setup.
        </p>
        <Input
          id="primary-domain"
          type="text"
          placeholder="company.co.za"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Existing Tenant Toggle */}
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
        <div className="space-y-1">
          <Label htmlFor="existing-tenant" className="text-base font-semibold text-slate-900 cursor-pointer">
            Customer has an existing M365 tenant
          </Label>
          <p className="text-sm text-slate-600">
            Enable if the customer already has a Microsoft 365 tenant that needs migration or linking.
          </p>
        </div>
        <Switch
          id="existing-tenant"
          checked={hasExistingTenant}
          onCheckedChange={setHasExistingTenant}
        />
      </div>

      {hasExistingTenant && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>Existing Tenant:</strong> Ensure the customer&apos;s IT contact can provide tenant admin
          credentials for migration. Additional setup time may apply.
        </div>
      )}
    </div>
  );
}
