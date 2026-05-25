'use client';

import { PiShieldBold, PiWarningCircleBold, PiArrowLeftBold } from 'react-icons/pi';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UnderlineTabs, TabPanel } from '@/components/admin/shared';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  KycHeader,
  KycStatCards,
  KycOverviewTab,
  KycVerificationTab,
  KycHistoryTab,
} from '@/components/admin/kyc/detail';

interface KycSession {
  id: string;
  didit_session_id: string;
  flow_type: string;
  user_type: string;
  status: string;
  extracted_data?: any;
  verification_result?: 'approved' | 'declined' | 'pending_review' | null;
  risk_tier?: string | null;
  created_at: string;
  completed_at?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  order?: { id: string; order_number: string; status: string } | null;
  quote?: { id: string; contact_name: string; contact_email: string; company_name?: string }[] | null;
}

const TAB_CONFIG = [
  { id: 'overview', label: 'Overview' },
  { id: 'verification', label: 'Verification' },
  { id: 'history', label: 'History' },
] as const;

type TabId = (typeof TAB_CONFIG)[number]['id'];

export default function AdminKycDetailPage() {
  const params = useParams();
  useAdminAuth();
  const [session, setSession] = useState<KycSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [editing, setEditing] = useState(false);

  const sessionId = Array.isArray(params.id) ? params.id[0] : params.id;

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!sessionId) {
        setError('Invalid session ID');
        return;
      }

      const response = await fetch(`/api/admin/kyc/sessions/${sessionId}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch KYC session');
      }

      setSession(result.session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load KYC session');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      fetchSession();
    }
  }, [sessionId, fetchSession]);

  const handleSave = () => {
    setEditing(false);
    fetchSession();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
              <PiShieldBold className="w-6 h-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-slate-500 mt-6 font-medium">Loading KYC session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <PiWarningCircleBold className="h-10 w-10 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Session Not Found</h2>
            <p className="text-slate-500 mb-6">{error || 'The KYC session does not exist.'}</p>
            <Link href="/admin/kyc">
              <Button className="bg-primary hover:bg-primary/90">
                <PiArrowLeftBold className="h-4 w-4 mr-2" />
                Back to KYC Review
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <KycHeader session={session} onEdit={() => { setActiveTab('verification'); setEditing(true); }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <KycStatCards session={session} />

        <UnderlineTabs
          tabs={TAB_CONFIG}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as TabId)}
        />

        <TabPanel id="overview" activeTab={activeTab}>
          <KycOverviewTab session={session} />
        </TabPanel>

        <TabPanel id="verification" activeTab={activeTab}>
          <KycVerificationTab
            session={session}
            editing={editing}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
          />
        </TabPanel>

        <TabPanel id="history" activeTab={activeTab}>
          <KycHistoryTab session={session} />
        </TabPanel>
      </div>
    </div>
  );
}
