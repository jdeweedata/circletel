'use client';

import { PiSpinnerBold, PiWarningCircleBold, PiArrowLeftBold } from 'react-icons/pi';
import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import type { QuoteDetails } from '@/lib/quotes/types';
import { calculatePricingBreakdown } from '@/lib/quotes/quote-calculator';
import { QuotePreview } from '@/components/admin/quotes/QuotePreview';

import { UnderlineTabs, TabPanel } from '@/components/admin/shared';
import { QuoteHeader } from '@/components/admin/quotes/detail/QuoteHeader';
import { QuoteStatCards } from '@/components/admin/quotes/detail/QuoteStatCards';
import { QuoteOverviewTab } from '@/components/admin/quotes/detail/QuoteOverviewTab';
import { QuoteFinancialsTab } from '@/components/admin/quotes/detail/QuoteFinancialsTab';
import { QuoteHistoryTab } from '@/components/admin/quotes/detail/QuoteHistoryTab';

interface Props {
  params: Promise<{ id: string }>;
}

const TAB_CONFIG = [
  { id: 'overview', label: 'Overview' },
  { id: 'financials', label: 'Financials' },
  { id: 'history', label: 'History' },
] as const;

type TabId = typeof TAB_CONFIG[number]['id'];

export default function AdminQuoteDetailPage({ params }: Props) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<QuoteDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchQuote();
  }, [resolvedParams.id]);

  const fetchQuote = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/quotes/business/${resolvedParams.id}`);
      const data = await response.json();

      if (data.success) {
        setQuote(data.quote);
      } else {
        setError(data.error || 'Failed to load quote');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load quote');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!quote) return;
    setActionLoading(true);
    try {
      const response = await fetch(`/api/quotes/business/${quote.id}/approve`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        await fetchQuote();
      } else {
        setError(data.error || 'Failed to approve quote');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to approve quote');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!quote || !rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }
    setActionLoading(true);
    try {
      const response = await fetch(`/api/quotes/business/${quote.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejection_reason: rejectionReason })
      });
      const data = await response.json();
      if (data.success) {
        setShowRejectForm(false);
        setRejectionReason('');
        await fetchQuote();
      } else {
        setError(data.error || 'Failed to reject quote');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reject quote');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSend = async () => {
    if (!quote) return;
    setActionLoading(true);
    try {
      const response = await fetch(`/api/quotes/business/${quote.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_email: quote.contact_email,
          message: 'Your business quote is ready for review.'
        })
      });
      const data = await response.json();
      if (data.success) {
        await fetchQuote();
      } else {
        setError(data.error || 'Failed to send quote');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send quote');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateShareLink = async () => {
    setSharingLoading(true);
    try {
      const response = await fetch(`/api/quotes/business/${quote?.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        setShareUrl(data.data.share_url);
        setShowShareDialog(true);
      } else {
        alert('Failed to generate share link: ' + data.error);
      }
    } catch (err: any) {
      alert('Error generating share link: ' + err.message);
    } finally {
      setSharingLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="text-center">
          <PiSpinnerBold className="w-8 h-8 animate-spin text-circleTel-orange mx-auto" />
          <p className="text-slate-500 mt-4 font-medium">Loading quote details...</p>
        </div>
      </div>
    );
  }

  // Error/Not Found State
  if (error || !quote) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="text-center max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <PiWarningCircleBold className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Quote Unavailable</h2>
          <p className="text-slate-500 mb-8">{error || 'The quote you are looking for does not exist.'}</p>
          <div className="flex flex-col gap-3">
            <Button onClick={fetchQuote} className="w-full bg-slate-900 text-white hover:bg-slate-800">
              Try Again
            </Button>
            <Link href="/admin/quotes" className="w-full">
              <Button variant="outline" className="w-full">
                <PiArrowLeftBold className="h-4 w-4 mr-2" />
                Back to Quotes
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate pricing
  const hasValidPricing = quote.subtotal_monthly > 0 || quote.total_monthly > 0;
  let pricing: {
    subtotal_monthly: number;
    vat_amount_monthly: number;
    total_monthly: number;
    subtotal_installation: number;
    vat_amount_installation: number;
    total_installation: number;
  };
  if (hasValidPricing) {
    pricing = {
      subtotal_monthly: quote.subtotal_monthly || 0,
      vat_amount_monthly: quote.vat_amount_monthly || 0,
      total_monthly: quote.total_monthly || 0,
      subtotal_installation: quote.subtotal_installation || 0,
      vat_amount_installation: quote.vat_amount_installation || 0,
      total_installation: quote.total_installation || 0,
    };
  } else {
    const calculated = calculatePricingBreakdown(
      quote.items,
      quote.contract_term,
      quote.custom_discount_percent || 0,
      quote.custom_discount_amount || 0
    );
    pricing = {
      subtotal_monthly: calculated.subtotal_monthly,
      vat_amount_monthly: calculated.vat_monthly,
      total_monthly: calculated.total_monthly,
      subtotal_installation: calculated.subtotal_installation,
      vat_amount_installation: calculated.vat_installation,
      total_installation: calculated.total_installation,
    };
  }

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden pb-12">
      {/* Header */}
      <QuoteHeader
        quote={quote}
        actionLoading={actionLoading}
        sharingLoading={sharingLoading}
        onApprove={handleApprove}
        onSend={handleSend}
        onRejectClick={() => setShowRejectForm(true)}
        onGenerateShareLink={handleGenerateShareLink}
      />

      {/* Rejection Form Modal */}
      <Dialog open={showRejectForm} onOpenChange={setShowRejectForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Reject Quote</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this quote</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection..."
              rows={3}
              className="resize-none"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                variant="destructive"
              >
                {actionLoading ? <PiSpinnerBold className="w-4 h-4 mr-2 animate-spin" /> : null}
                Confirm Rejection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Quote Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>Quote Preview</DialogTitle>
            <DialogDescription>This is how the quote will appear to the customer</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto">
            <QuotePreview 
              formData={{
                company_name: quote.company_name,
                registration_number: quote.registration_number || undefined,
                vat_number: quote.vat_number || undefined,
                contact_name: quote.contact_name,
                contact_email: quote.contact_email,
                contact_phone: quote.contact_phone,
                service_address: quote.service_address,
                contract_term: quote.contract_term.toString(),
                custom_discount_percent: quote.custom_discount_percent || 0,
                customer_notes: quote.customer_notes || undefined,
              }}
              items={quote.items.map(i => ({
                package: {
                  name: i.service_name,
                  speed: `${i.speed_down}Mbps ↓ / ${i.speed_up}Mbps ↑`,
                  pricing: {
                    monthly: i.monthly_price,
                    installation: i.installation_price
                  }
                },
                quantity: i.quantity,
                item_type: i.item_type
              }))}
              mtnDeals={quote.metadata?.mtn_deals || []}
              pricing={{
                subtotalMonthly: pricing.subtotal_monthly,
                subtotalInstallation: pricing.subtotal_installation,
                discountPercent: quote.custom_discount_percent || 0,
                discountAmount: quote.custom_discount_amount || 0,
                afterDiscount: pricing.subtotal_monthly - (quote.custom_discount_amount || 0),
                vat: pricing.vat_amount_monthly + pricing.vat_amount_installation,
                total: pricing.total_monthly + pricing.total_installation,
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Quote Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Quote Link</DialogTitle>
            <DialogDescription>
              Copy this link to manually share the quote with the customer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-3 bg-gray-50 border rounded break-all font-mono text-sm text-gray-700">
              {shareUrl}
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleCopyLink}>
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content Areas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        
        {/* Stat Cards */}
        <QuoteStatCards quote={quote} pricing={pricing} />

        {/* Tab Navigation */}
        <UnderlineTabs
          tabs={TAB_CONFIG}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as TabId)}
        />

        {/* Tab Panels */}
        <TabPanel id="overview" activeTab={activeTab}>
          <QuoteOverviewTab quote={quote} />
        </TabPanel>

        <TabPanel id="financials" activeTab={activeTab}>
          <QuoteFinancialsTab quote={quote} pricing={pricing} />
        </TabPanel>

        <TabPanel id="history" activeTab={activeTab}>
          <QuoteHistoryTab quote={quote} />
        </TabPanel>

      </div>
    </div>
  );
}
