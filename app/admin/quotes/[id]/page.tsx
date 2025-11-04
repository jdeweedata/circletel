'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  User,
  Download
} from 'lucide-react';
import type { QuoteDetails } from '@/lib/quotes/types';
import { calculatePricingBreakdown } from '@/lib/quotes/quote-calculator';

interface Props {
  params: Promise<{ id: string }>;
}

export default function AdminQuoteDetailPage({ params }: Props) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<QuoteDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

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
        await fetchQuote(); // Refresh quote data
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
        await fetchQuote(); // Refresh quote data
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
        await fetchQuote(); // Refresh quote data
      } else {
        setError(data.error || 'Failed to send quote');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send quote');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-500',
      pending_approval: 'bg-yellow-500',
      approved: 'bg-blue-500',
      sent: 'bg-purple-500',
      viewed: 'bg-indigo-500',
      accepted: 'bg-green-500',
      rejected: 'bg-red-500',
      expired: 'bg-orange-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  if (error && !quote) {
    return (
      <div className="p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
            <div className="flex gap-4 mt-4">
              <Button onClick={fetchQuote}>Retry</Button>
              <Button variant="outline" onClick={() => router.push('/admin/quotes')}>
                Back to Quotes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quote) return null;

  // Calculate pricing dynamically if database values are 0 or missing
  const pricing = React.useMemo(() => {
    const hasValidPricing = quote.subtotal_monthly > 0 || quote.total_monthly > 0;
    
    if (hasValidPricing) {
      // Use database values
      return {
        subtotal_monthly: quote.subtotal_monthly || 0,
        vat_amount_monthly: quote.vat_amount_monthly || 0,
        total_monthly: quote.total_monthly || 0,
        subtotal_installation: quote.subtotal_installation || 0,
        vat_amount_installation: quote.vat_amount_installation || 0,
        total_installation: quote.total_installation || 0,
      };
    } else {
      // Calculate from items
      const calculated = calculatePricingBreakdown(
        quote.items,
        quote.contract_term,
        quote.custom_discount_percent || 0,
        quote.custom_discount_amount || 0
      );
      
      return {
        subtotal_monthly: calculated.subtotal_monthly,
        vat_amount_monthly: calculated.vat_monthly,
        total_monthly: calculated.total_monthly,
        subtotal_installation: calculated.subtotal_installation,
        vat_amount_installation: calculated.vat_installation,
        total_installation: calculated.total_installation,
      };
    }
  }, [quote]);

  const canApprove = quote.status === 'pending_approval' || quote.status === 'draft';
  const canReject = ['draft', 'pending_approval', 'sent', 'viewed'].includes(quote.status);
  const canSend = quote.status === 'approved';

  const handleDownloadPDF = () => {
    window.open(`/api/quotes/business/${quote.id}/pdf`, '_blank');
  };

  const handlePreview = () => {
    window.open(`/quotes/business/${quote.id}/preview`, '_blank');
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/quotes')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-circleTel-darkNeutral">
              {quote.quote_number}
            </h1>
            <p className="text-circleTel-secondaryNeutral mt-1">
              {quote.company_name}
            </p>
          </div>
          <Badge className={`${getStatusColor(quote.status)} text-white`}>
            {formatStatus(quote.status)}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handlePreview}
            variant="outline"
            className="border-blue-500 text-blue-600 hover:bg-blue-600 hover:text-white"
          >
            <FileText className="w-4 h-4 mr-2" />
            Preview
          </Button>

          <Button
            onClick={handleDownloadPDF}
            variant="outline"
            className="border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>

          {canApprove && (
            <Button
              onClick={handleApprove}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Approve Quote
            </Button>
          )}

          {canSend && (
            <Button
              onClick={handleSend}
              disabled={actionLoading}
              className="bg-circleTel-orange hover:bg-[#e67516]"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              Send to Customer
            </Button>
          )}

          {canReject && (
            <Button
              onClick={() => setShowRejectForm(!showRejectForm)}
              disabled={actionLoading}
              variant="destructive"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject Quote
            </Button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Rejection Form */}
      {showRejectForm && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800">Reject Quote</CardTitle>
            <CardDescription>Please provide a reason for rejecting this quote</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection..."
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                variant="destructive"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Confirm Rejection
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Company Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-circleTel-secondaryNeutral">Company Name</p>
                  <p className="font-medium">{quote.company_name}</p>
                </div>
                <div>
                  <p className="text-sm text-circleTel-secondaryNeutral">Customer Type</p>
                  <p className="font-medium">{quote.customer_type.toUpperCase()}</p>
                </div>
                {quote.registration_number && (
                  <div>
                    <p className="text-sm text-circleTel-secondaryNeutral">Registration Number</p>
                    <p className="font-medium">{quote.registration_number}</p>
                  </div>
                )}
                {quote.vat_number && (
                  <div>
                    <p className="text-sm text-circleTel-secondaryNeutral">VAT Number</p>
                    <p className="font-medium">{quote.vat_number}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-circleTel-secondaryNeutral" />
                <span>{quote.contact_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-circleTel-secondaryNeutral" />
                <a href={`mailto:${quote.contact_email}`} className="text-circleTel-orange hover:underline">
                  {quote.contact_email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-circleTel-secondaryNeutral" />
                <span>{quote.contact_phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-circleTel-secondaryNeutral" />
                <span>{quote.service_address}</span>
              </div>
            </CardContent>
          </Card>

          {/* Service Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Services ({quote.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quote.items.map((item, index) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{item.service_name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {item.item_type}
                          </Badge>
                        </div>
                        <div className="text-sm text-circleTel-secondaryNeutral space-y-1">
                          <p>Speed: {item.speed_down}Mbps down / {item.speed_up}Mbps up</p>
                          {item.data_cap_gb && <p>Data Cap: {item.data_cap_gb}GB</p>}
                          <p>Quantity: {item.quantity}</p>
                          {item.notes && <p className="italic">Note: {item.notes}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {formatCurrency(item.monthly_price * item.quantity)}
                          <span className="text-sm font-normal">/mo</span>
                        </p>
                        {item.installation_price > 0 && (
                          <p className="text-sm text-circleTel-secondaryNeutral">
                            + {formatCurrency(item.installation_price)} install
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customer Notes */}
          {quote.customer_notes && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-circleTel-secondaryNeutral whitespace-pre-wrap">
                  {quote.customer_notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Monthly Pricing */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Monthly Recurring</p>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal (Excl. VAT)</span>
                  <span className="font-medium">{formatCurrency(pricing.subtotal_monthly)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">VAT (15%)</span>
                  <span className="font-medium">{formatCurrency(pricing.vat_amount_monthly)}</span>
                </div>
                
                <div className="border-t-2 border-gray-200 pt-2 flex justify-between">
                  <span className="font-bold text-gray-900">Total (Incl. VAT)</span>
                  <span className="font-bold text-xl text-circleTel-orange">{formatCurrency(pricing.total_monthly)}</span>
                </div>
              </div>

              {/* Installation Pricing */}
              {(pricing.subtotal_installation > 0 || pricing.total_installation > 0) && (
                <div className="space-y-2 pt-4 border-t">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Installation (Once-off)</p>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal (Excl. VAT)</span>
                    <span className="font-medium">{formatCurrency(pricing.subtotal_installation)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">VAT (15%)</span>
                    <span className="font-medium">{formatCurrency(pricing.vat_amount_installation)}</span>
                  </div>
                  
                  <div className="border-t-2 border-gray-200 pt-2 flex justify-between">
                    <span className="font-bold text-gray-900">Total (Incl. VAT)</span>
                    <span className="font-bold text-lg">{formatCurrency(pricing.total_installation)}</span>
                  </div>
                </div>
              )}

              {/* Contract Info */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Contract Term</span>
                  <span className="font-semibold">{quote.contract_term} months</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Contract Value</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(pricing.total_monthly * quote.contract_term + pricing.total_installation)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-circleTel-secondaryNeutral">Created</p>
                <p className="font-medium">{formatDate(quote.created_at)}</p>
                {quote.created_by && (
                  <p className="text-xs text-circleTel-secondaryNeutral">
                    by Admin User
                  </p>
                )}
              </div>
              {quote.approved_at && (
                <div>
                  <p className="text-circleTel-secondaryNeutral">Approved</p>
                  <p className="font-medium">{formatDate(quote.approved_at)}</p>
                  {quote.approved_by_admin && (
                    <p className="text-xs text-circleTel-secondaryNeutral">
                      by {quote.approved_by_admin.full_name}
                    </p>
                  )}
                </div>
              )}
              {quote.sent_at && (
                <div>
                  <p className="text-circleTel-secondaryNeutral">Sent to Customer</p>
                  <p className="font-medium">{formatDate(quote.sent_at)}</p>
                </div>
              )}
              {quote.signed_at && (
                <div>
                  <p className="text-circleTel-secondaryNeutral">Signed</p>
                  <p className="font-medium">{formatDate(quote.signed_at)}</p>
                </div>
              )}
              <div>
                <p className="text-circleTel-secondaryNeutral">Valid Until</p>
                <p className="font-medium">{formatDate(quote.valid_until)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Versions */}
          {quote.versions && quote.versions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Version History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {quote.versions.map((version) => (
                    <div key={version.id} className="border-l-2 border-circleTel-orange pl-3">
                      <p className="font-medium">Version {version.version_number}</p>
                      <p className="text-xs text-circleTel-secondaryNeutral">
                        {formatDate(version.created_at)}
                      </p>
                      {version.change_notes && (
                        <p className="text-xs mt-1">{version.change_notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
