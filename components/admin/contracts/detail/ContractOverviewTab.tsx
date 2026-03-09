'use client';

import { SectionCard, InfoRow } from '@/components/admin/shared';
import { formatCurrency } from '@/lib/quotes/quote-calculator';
import {
  PiBuildingsBold,
  PiMapPinBold,
  PiFileTextBold,
  PiCurrencyCircleDollarBold,
} from 'react-icons/pi';

interface Quote {
  id: string;
  quoteNumber?: string;
  companyName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  serviceAddress?: string;
  billingAddress?: string | null;
  status?: string;
  validUntil?: string;
}

interface KycSession {
  id: string;
  diditSessionId?: string | null;
  status: string;
  verificationResult?: unknown;
  riskTier?: string | null;
  flowType?: string;
  userType?: string;
  completedAt?: string | null;
  createdAt?: string;
}

interface ContractOverviewTabProps {
  contract: {
    contract_type: string;
    contract_term_months: number;
    start_date: string | null;
    end_date: string | null;
    monthly_recurring: number;
    installation_fee: number;
    once_off_fee: number;
    total_contract_value: number;
    company_name?: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    service_address?: string;
  };
  quote: Quote | null;
  kyc: KycSession | null;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatContractType(type: string): string {
  const types: Record<string, string> = {
    fibre: 'Fibre',
    wireless: 'Wireless',
    hybrid: 'Hybrid',
    managed_wireless: 'Managed Wireless',
  };
  return types[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export function ContractOverviewTab({
  contract,
  quote,
  kyc,
}: ContractOverviewTabProps) {
  // Get company info from quote or contract (quote uses camelCase from API)
  const companyName = quote?.companyName || contract.company_name || '-';
  const contactPerson = quote?.contactPerson || contract.contact_person || '-';
  const email = quote?.email || contract.email || '-';
  const phone = quote?.phone || contract.phone || '-';
  const serviceAddress = quote?.serviceAddress || contract.service_address || 'Not specified';

  return (
    <div className="space-y-6">
      {/* Company and Contact Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Company Details" icon={PiBuildingsBold}>
          <InfoRow label="Company Name" value={companyName} />
          <InfoRow label="Contact Person" value={contactPerson} />
          <InfoRow label="Email" value={email} />
          <InfoRow label="Phone" value={phone} />
        </SectionCard>

        <SectionCard title="Service Address" icon={PiMapPinBold}>
          <p className="text-sm text-slate-700">{serviceAddress}</p>
          {kyc && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <InfoRow
                label="KYC Status"
                value={
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    kyc.status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                    kyc.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {kyc.status}
                  </span>
                }
              />
              {kyc.riskTier && <InfoRow label="Risk Tier" value={kyc.riskTier} />}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Contract and Pricing Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Contract Details" icon={PiFileTextBold}>
          <InfoRow label="Contract Type" value={formatContractType(contract.contract_type)} />
          <InfoRow label="Contract Term" value={`${contract.contract_term_months} months`} />
          <InfoRow label="Start Date" value={formatDate(contract.start_date)} />
          <InfoRow label="End Date" value={formatDate(contract.end_date)} />
        </SectionCard>

        <SectionCard title="Pricing Breakdown" icon={PiCurrencyCircleDollarBold}>
          <InfoRow label="Monthly Recurring" value={formatCurrency(contract.monthly_recurring)} />
          <InfoRow label="Installation Fee" value={formatCurrency(contract.installation_fee)} />
          <InfoRow label="Once-off Fee" value={formatCurrency(contract.once_off_fee)} />
          <div className="border-t border-slate-200 mt-2 pt-2">
            <InfoRow
              label="Total Contract Value"
              value={
                <span className="font-bold text-emerald-600">
                  {formatCurrency(contract.total_contract_value)}
                </span>
              }
            />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
