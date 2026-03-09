'use client';

import {
  PiFileTextBold,
  PiWarningCircleBold,
  PiArrowLeftBold,
} from 'react-icons/pi';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UnderlineTabs, TabPanel } from '@/components/admin/shared';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  ContractHeader,
  ContractStatCards,
  ContractOverviewTab,
  ContractSignaturesTab,
  ContractDocumentsTab,
  ContractTimeline,
} from '@/components/admin/contracts/detail';

interface Contract {
  id: string;
  contract_number: string;
  quote_id: string;
  customer_id: string | null;
  kyc_session_id: string | null;
  contract_type: 'fibre' | 'wireless' | 'hybrid';
  contract_term_months: number;
  start_date: string | null;
  end_date: string | null;
  monthly_recurring: number;
  once_off_fee: number;
  installation_fee: number;
  total_contract_value: number;
  zoho_sign_request_id: string | null;
  customer_signature_date: string | null;
  circletel_signature_date: string | null;
  fully_signed_date: string | null;
  signed_pdf_url: string | null;
  pdf_url: string | null;
  status: string;
  zoho_deal_id: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Quote {
  id: string;
  quoteNumber: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  serviceAddress?: string;
  billingAddress?: string | null;
  status: string;
  validUntil?: string;
}

interface KycSession {
  id: string;
  diditSessionId: string | null;
  status: string;
  verificationResult: any;
  riskTier: string | null;
  flowType: string;
  userType: string;
  completedAt: string | null;
  createdAt: string;
}

interface ContractData {
  contract: Contract;
  quote: Quote;
  kyc: KycSession | null;
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  } | null;
  signature: {
    zohoSignRequestId: string | null;
    customerSignatureDate: string | null;
    circletelSignatureDate: string | null;
    fullySignedDate: string | null;
  };
}

const TAB_CONFIG = [
  { id: 'overview', label: 'Overview' },
  { id: 'signatures', label: 'Signatures' },
  { id: 'documents', label: 'Documents' },
  { id: 'history', label: 'History' },
] as const;

type TabId = (typeof TAB_CONFIG)[number]['id'];

export default function AdminContractDetailPage() {
  const params = useParams();
  useAdminAuth();
  const [data, setData] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const contractId = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (contractId) {
      fetchContract();
    }
  }, [contractId]);

  const fetchContract = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!contractId) {
        setError('Invalid contract ID');
        return;
      }

      const response = await fetch(`/api/admin/contracts/${contractId}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch contract');
      }

      if (!result.data) {
        setError('Contract not found');
        return;
      }

      setData(result.data);
    } catch (err) {
      console.error('Error fetching contract:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contract');
    } finally {
      setLoading(false);
    }
  };

  const handleSendForSignature = async () => {
    if (!contractId) return;

    try {
      const response = await fetch(`/api/contracts/${contractId}/send-for-signature`, {
        method: 'POST',
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to send for signature');
      }

      // Refresh contract data
      await fetchContract();
    } catch (err) {
      console.error('Error sending for signature:', err);
      alert(err instanceof Error ? err.message : 'Failed to send for signature');
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
              <PiFileTextBold className="w-6 h-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-slate-500 mt-6 font-medium">Loading contract details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error/Not Found State
  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <PiWarningCircleBold className="h-10 w-10 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Contract Not Found</h2>
            <p className="text-slate-500 mb-6">{error || 'The contract you are looking for does not exist.'}</p>
            <Link href="/admin/contracts">
              <Button className="bg-primary hover:bg-primary/90">
                <PiArrowLeftBold className="h-4 w-4 mr-2" />
                Back to Contracts
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { contract, quote, kyc, signature } = data;

  // Build combined contract object for components
  const contractWithQuote = {
    ...contract,
    company_name: quote.companyName,
    contact_person: quote.contactPerson,
    email: quote.email,
    phone: quote.phone,
    service_address: quote.serviceAddress,
    billing_address: quote.billingAddress,
    quote_number: quote.quoteNumber,
    kyc_status: kyc?.status || null,
    kyc_risk_tier: kyc?.riskTier || null,
  };

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      {/* Header */}
      <ContractHeader
        contract={contractWithQuote}
        onSendForSignature={handleSendForSignature}
        onRefresh={fetchContract}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Stat Cards */}
        <ContractStatCards contract={contractWithQuote} />

        {/* Tabs */}
        <UnderlineTabs
          tabs={TAB_CONFIG}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as TabId)}
        />

        {/* OVERVIEW TAB */}
        <TabPanel id="overview" activeTab={activeTab} className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ContractOverviewTab contract={contractWithQuote} quote={quote} kyc={kyc} />
            </div>
            <div>
              <ContractTimeline contract={contract} />
            </div>
          </div>
        </TabPanel>

        {/* SIGNATURES TAB */}
        <TabPanel id="signatures" activeTab={activeTab} className="mt-6">
          <ContractSignaturesTab
            contract={contract}
            signature={signature}
            onResend={handleSendForSignature}
          />
        </TabPanel>

        {/* DOCUMENTS TAB */}
        <TabPanel id="documents" activeTab={activeTab} className="mt-6">
          <ContractDocumentsTab contract={contract} />
        </TabPanel>

        {/* HISTORY TAB */}
        <TabPanel id="history" activeTab={activeTab} className="mt-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="text-center py-8 text-slate-500">
              <PiFileTextBold className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="font-medium">Contract History</p>
              <p className="text-sm text-slate-400 mt-1">
                Activity log and audit trail will appear here
              </p>
            </div>
          </div>
        </TabPanel>
      </div>
    </div>
  );
}
