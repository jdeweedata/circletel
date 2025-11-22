'use client';

import React, { useState, useEffect, use } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  User,
  Check,
  Printer,
  Download,
  Send
} from 'lucide-react';
import type { QuoteDetails } from '@/lib/quotes/types';
import { calculatePricingBreakdown } from '@/lib/quotes/quote-calculator';

interface Props {
  params: Promise<{ id: string }>;
}

export default function QuotePreviewPage({ params }: Props) {
  const resolvedParams = use(params);
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<QuoteDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  // Add print-specific styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        @page {
          size: A4;
          margin: 15mm;
        }

        body {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }

        /* Prevent page breaks inside these elements */
        .quote-header,
        .customer-details,
        .service-summary,
        .quote-item,
        .pricing-breakdown,
        .terms-section,
        .customer-acceptance,
        .footer-section {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        /* Add page break before major sections if needed */
        .terms-section {
          page-break-before: auto;
        }

        .customer-acceptance {
          page-break-before: auto;
        }

        /* Ensure tables don't break */
        table {
          page-break-inside: avoid;
        }

        /* Remove margins on print container */
        .print-container {
          margin: 0 !important;
          padding: 0 !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    fetchQuote();
  }, [resolvedParams.id]);

  // Track quote views and time spent
  useEffect(() => {
    if (!quote) return;

    // Get or create session ID
    let sessionId = sessionStorage.getItem('quote_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('quote_session_id', sessionId);
    }

    // Track initial view
    fetch(`/api/quotes/business/${resolvedParams.id}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'view',
        session_id: sessionId,
        metadata: {
          quote_number: quote.quote_number,
          page_url: window.location.href
        }
      })
    }).catch(err => console.error('Tracking error:', err));

    // Track time spent on page
    const startTime = Date.now();

    const trackTimeSpent = () => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      if (timeSpent > 5) { // Only track if user spent more than 5 seconds
        fetch(`/api/quotes/business/${resolvedParams.id}/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'view',
            session_id: sessionId,
            time_spent_seconds: timeSpent,
            metadata: {
              engagement_type: 'extended_view'
            }
          })
        }).catch(err => console.error('Time tracking error:', err));
      }
    };

    // Track on page unload
    window.addEventListener('beforeunload', trackTimeSpent);

    return () => {
      window.removeEventListener('beforeunload', trackTimeSpent);
      trackTimeSpent();
    };
  }, [quote, resolvedParams.id]);

  const fetchQuote = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if this is a shared/public access (via query parameter)
      const urlParams = new URLSearchParams(window.location.search);
      const isShared = urlParams.get('shared') === 'true';

      // Use public endpoint for shared access, admin endpoint otherwise
      const endpoint = isShared
        ? `/api/quotes/business/${resolvedParams.id}/public`
        : `/api/quotes/business/${resolvedParams.id}`;

      const response = await fetch(endpoint);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'draft': 'bg-gray-500',
      'pending_approval': 'bg-yellow-500',
      'approved': 'bg-green-600',
      'sent': 'bg-blue-500',
      'viewed': 'bg-purple-500',
      'accepted': 'bg-green-700',
      'rejected': 'bg-red-600',
      'expired': 'bg-gray-600'
    };
    return colors[status] || 'bg-gray-500';
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleDownloadPDF = () => {
    // Use browser's print-to-PDF to ensure exact match with preview
    window.print();
  };

  const handleEmailQuote = async () => {
    if (!emailRecipient || !quote) return;

    setEmailSending(true);
    try {
      const response = await fetch(`/api/quotes/business/${quote.id}/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientEmail: emailRecipient,
          recipientName: quote.contact_name,
          message: emailMessage || undefined
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to send email');
      }

      alert(`Quote successfully sent to ${emailRecipient}`);
      setShowEmailDialog(false);
      setEmailRecipient('');
      setEmailMessage('');
    } catch (error: any) {
      console.error('Email error:', error);
      alert(`Failed to send email: ${error.message}`);
    } finally {
      setEmailSending(false);
    }
  };

  const openEmailDialog = () => {
    if (quote) {
      setEmailRecipient(quote.contact_email);
      setShowEmailDialog(true);
    }
  };

  // Generate dynamic benefits based on quote items
  const generateInclusiveBenefits = (items: any[]) => {
    const benefits = new Set<string>();
    
    // Base benefits for all CircleTel services
    benefits.add('South African-based customer support');
    benefits.add('24/7 Network Operations Centre (NOC) monitoring');
    benefits.add('Professional installation and configuration');
    
    // Add service-specific benefits
    items.forEach(item => {
      const serviceType = item.item_type?.toLowerCase();
      const serviceName = item.service_name?.toLowerCase();
      
      if (serviceType === 'fibre' || serviceName?.includes('fibre')) {
        benefits.add('99.9% Service Level Agreement (SLA)');
        benefits.add('Unlimited data usage');
        benefits.add('Symmetric upload/download speeds');
        benefits.add('Static IP address allocation');
        benefits.add('No fair usage policy restrictions');
      }
      
      if (serviceType === 'wireless' || serviceName?.includes('wireless')) {
        benefits.add('99.5% Service Level Agreement (SLA)');
        benefits.add('Weather-resistant equipment');
        benefits.add('Line-of-sight installation assessment');
      }
      
      if (serviceType === 'cloud' || serviceName?.includes('cloud') || serviceName?.includes('hosting')) {
        benefits.add('99.9% uptime guarantee');
        benefits.add('Daily automated backups');
        benefits.add('24/7 server monitoring');
        benefits.add('DDoS protection included');
        benefits.add('Free SSL certificates');
      }
      
      if (serviceType === 'voice' || serviceName?.includes('voice') || serviceName?.includes('pbx')) {
        benefits.add('HD voice quality');
        benefits.add('Call recording capabilities');
        benefits.add('Auto-attendant features');
        benefits.add('Mobile app integration');
      }
      
      // Business-specific benefits
      if (quote.customer_type === 'business' || quote.customer_type === 'enterprise') {
        benefits.add('Dedicated account manager');
        benefits.add('Priority technical support');
        benefits.add('Service level reporting');
        benefits.add('Equipment maintenance and replacement');
        benefits.add('Monthly usage reporting and analytics');
      }
    });
    
    // Always include basic support
    benefits.add('Free technical support during business hours');
    
    return Array.from(benefits).sort();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-circleTel-lightNeutral">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-circleTel-orange mb-4" />
          <p className="text-circleTel-secondaryNeutral">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-circleTel-lightNeutral p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-circleTel-darkNeutral mb-2">Quote Not Found</h2>
              <p className="text-circleTel-secondaryNeutral">{error || 'This quote could not be found or has been removed.'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate pricing
  const hasValidPricing = quote.subtotal_monthly > 0 || quote.total_monthly > 0;
  
  let pricing;
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
    <div className="min-h-screen bg-white print:bg-white">
      <div className="max-w-4xl mx-auto p-8 print:p-0 print:max-w-none print-container">
        {/* Action Buttons - Centered above quote */}
        <div className="print:hidden flex justify-center gap-3 mb-6">
          <button
            onClick={() => window.print()}
            className="bg-white text-circleTel-orange border-2 border-circleTel-orange px-6 py-2.5 rounded-lg shadow-md hover:bg-orange-50 transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
            className="bg-white text-circleTel-orange border-2 border-circleTel-orange px-6 py-2.5 rounded-lg shadow-md hover:bg-orange-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloadingPDF ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {downloadingPDF ? 'Downloading...' : 'Download PDF'}
          </button>
          <button
            onClick={openEmailDialog}
            className="bg-circleTel-orange text-white px-6 py-2.5 rounded-lg shadow-md hover:bg-orange-600 transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Email Quote
          </button>
        </div>

      {/* Email Dialog */}
      {showEmailDialog && (
        <div className="print:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-4">Email Quote</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-circleTel-orange"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personal Message (Optional)
                </label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-circleTel-orange"
                  placeholder="Add a personal message to include in the email..."
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowEmailDialog(false);
                  setEmailRecipient('');
                  setEmailMessage('');
                }}
                disabled={emailSending}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleEmailQuote}
                disabled={!emailRecipient || emailSending}
                className="flex-1 px-4 py-2 bg-circleTel-orange text-white rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {emailSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Professional Header - Matching PDF */}
        <div className="bg-white mb-8 quote-header">
          {/* Official CircleTel Header */}
          <div className="flex justify-between items-center mb-8 pb-4 border-b-4 border-circleTel-orange">
            <div className="flex items-center">
              <Image
                src="/images/circletel-enclosed-logo.png"
                alt="CircleTel Logo"
                width={360}
                height={120}
                className="h-32 w-auto"
                priority
              />
            </div>
            <div className="text-right text-sm text-gray-600">
              <div>Tel: +27 87 087 6305</div>
              <div>Email: quotes@circletel.co.za</div>
              <div>Web: www.circletel.co.za</div>
            </div>
          </div>

          {/* Quote Header - Match Official Format */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">QUOTE</h2>
              <div className="space-y-1 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <span className="text-gray-600">Quote No:</span>
                  <span className="font-medium text-circleTel-orange">{quote.quote_number}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{formatDate(quote.created_at)}</span>
                </div>
                {quote.valid_until && (
                  <div className="grid grid-cols-2 gap-4">
                    <span className="text-gray-600">Valid Until:</span>
                    <span className="font-medium">{formatDate(quote.valid_until)}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <span className="text-gray-600">Status:</span>
                  <Badge className={`${getStatusColor(quote.status)} text-white text-xs px-2 py-1`}>
                    {formatStatus(quote.status)}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-gray-50 p-4 rounded border">
                <p className="text-xs text-gray-500 mb-2 uppercase">PREPARED FOR:</p>
                <p className="font-bold text-lg text-gray-900">{quote.company_name}</p>
                <p className="text-sm text-gray-600">{quote.contact_name}</p>
                <p className="text-sm text-gray-600">{quote.contact_email}</p>
                <p className="text-sm text-gray-600">{quote.contact_phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Details and Service Summary - Official Layout */}
        <div className="grid grid-cols-2 gap-12 mb-8 customer-details">
          <div className="pr-6 border-r border-gray-200">
            <h3 className="text-base font-bold text-gray-900 mb-4 uppercase">
              CUSTOMER DETAILS
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-600 whitespace-nowrap">Company:</span>
                <span className="font-medium text-right">{quote.company_name}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-600 whitespace-nowrap">Contact Person:</span>
                <span className="font-medium text-right">{quote.contact_name}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-600 whitespace-nowrap">Email:</span>
                <span className="font-medium text-blue-600 text-right break-all">{quote.contact_email}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-600 whitespace-nowrap">Phone:</span>
                <span className="font-medium text-right">{quote.contact_phone}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-600 whitespace-nowrap">Service Address:</span>
                <span className="font-medium text-right">{quote.service_address}</span>
              </div>
            </div>
          </div>

          <div className="pl-6">
            <h3 className="text-base font-bold text-gray-900 mb-4 uppercase">
              SERVICE SUMMARY
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-600 whitespace-nowrap">Customer Type:</span>
                <span className="font-medium text-right capitalize">{quote.customer_type}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-600 whitespace-nowrap">Contract Term:</span>
                <span className="font-medium text-right">{quote.contract_term} months</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-600 whitespace-nowrap">Services:</span>
                <span className="font-medium text-right">{quote.items.length} package(s)</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-600 whitespace-nowrap">Monthly Total:</span>
                <span className="font-bold text-circleTel-orange text-base text-right">
                  {formatCurrency(pricing.total_monthly)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Service Package Details Table - Official Format */}
        <div className="mb-8">
          <h3 className="text-base font-bold text-gray-900 mb-4 uppercase">
            SERVICE PACKAGE DETAILS
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left font-medium">Service Description</th>
                  <th className="border border-gray-300 px-3 py-2 text-center font-medium">Qty</th>
                  <th className="border border-gray-300 px-3 py-2 text-center font-medium">Speed</th>
                  <th className="border border-gray-300 px-3 py-2 text-center font-medium">Data</th>
                  <th className="border border-gray-300 px-3 py-2 text-center font-medium">Monthly (Excl. VAT)</th>
                  <th className="border border-gray-300 px-3 py-2 text-center font-medium">Installation (Excl. VAT)</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-3">
                      <div>
                        <div className="font-medium text-gray-900">{item.service_name}</div>
                        <div className="text-xs text-gray-500 capitalize italic">{item.item_type}</div>
                      </div>
                    </td>
                    <td className="border border-gray-300 px-3 py-3 text-center font-medium">{item.quantity}</td>
                    <td className="border border-gray-300 px-3 py-3 text-center">
                      {item.speed_down}↓/{item.speed_up}↑ Mbps
                    </td>
                    <td className="border border-gray-300 px-3 py-3 text-center">
                      {item.data_cap_gb ? `${item.data_cap_gb}GB` : 'Unlimited'}
                    </td>
                    <td className="border border-gray-300 px-3 py-3 text-center font-medium">
                      {formatCurrency(item.monthly_price * item.quantity)}
                    </td>
                    <td className="border border-gray-300 px-3 py-3 text-center font-medium">
                      {formatCurrency(item.installation_price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing Breakdown and Inclusive Benefits */}
        <div className="grid grid-cols-2 gap-8 mb-8 pricing-breakdown">
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-4 uppercase">
              PRICING BREAKDOWN
            </h3>
            
            {/* Monthly Recurring Costs */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3 text-sm uppercase">
                MONTHLY RECURRING COSTS
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal (Excl. VAT):</span>
                  <span className="font-medium">{formatCurrency(pricing.subtotal_monthly)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">VAT (15%):</span>
                  <span className="font-medium">{formatCurrency(pricing.vat_amount_monthly)}</span>
                </div>
                <div className="border-t border-gray-300 pt-2 flex justify-between font-bold text-base">
                  <span className="text-gray-900">Monthly Total (Incl. VAT):</span>
                  <span className="text-circleTel-orange">{formatCurrency(pricing.total_monthly)}</span>
                </div>
              </div>
            </div>

            {/* Installation Costs */}
            {(pricing.subtotal_installation > 0 || pricing.total_installation > 0) && (
              <div className="mb-6">
                <h4 className="font-medium text-circleTel-darkNeutral mb-3 text-sm uppercase tracking-wide">
                  One-time Installation Costs
                </h4>
                <div className="bg-gray-50 p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal (Excl. VAT):</span>
                    <span className="font-mono">{formatCurrency(pricing.subtotal_installation)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT (15%):</span>
                    <span className="font-mono">{formatCurrency(pricing.vat_amount_installation)}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-2 flex justify-between font-bold">
                    <span>Installation Total (Incl. VAT):</span>
                    <span className="font-mono text-circleTel-orange">{formatCurrency(pricing.total_installation)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Contract Summary - Highlighted Box Like Official Quote */}
            <div>
              <h4 className="font-bold text-gray-900 mb-3 text-base uppercase">
                CONTRACT SUMMARY
              </h4>
              <div className="bg-red-50 border-2 border-red-500 p-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-800 font-medium">Contract Term:</span>
                  <span className="font-bold text-lg">{quote.contract_term} months</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-800 font-medium">Total Contract Value:</span>
                  <span className="font-bold text-2xl text-circleTel-orange">
                    {formatCurrency(pricing.total_monthly * quote.contract_term + pricing.total_installation)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-gray-900 mb-4 uppercase">
              INCLUSIVE BENEFITS
            </h3>
            <div className="space-y-2 text-sm">
              {generateInclusiveBenefits(quote.items).map((benefit, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Additional Notes */}
            {quote.notes && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3 text-sm uppercase">
                  Additional Notes
                </h4>
                <div className="bg-blue-50 border border-blue-200 p-3 text-sm">
                  <p className="text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="mb-8 terms-section">
          <h3 className="text-lg font-bold text-circleTel-darkNeutral mb-4 border-b border-gray-300 pb-2">
            TERMS AND CONDITIONS
          </h3>
          <div className="grid grid-cols-2 gap-8 text-xs leading-relaxed">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-1">1. CONTRACT TERMS</h4>
                <p>This quote is valid for 30 days from the date issued. Pricing is subject to change after this period. Contract term as specified above.</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">2. INSTALLATION</h4>
                <p>Installation will be scheduled within 7-14 business days of order confirmation, subject to site readiness and third-party provider availability.</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">3. PAYMENT TERMS</h4>
                <p>Monthly charges are payable in advance. Installation fees are due on completion of installation. All amounts are inclusive of VAT where applicable.</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">4. SERVICE LEVEL AGREEMENT</h4>
                <p>CircleTel provides a 99.5% uptime SLA measured monthly. Service credits apply for verified outages exceeding SLA thresholds.</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-1">5. CANCELLATION</h4>
                <p>30 days written notice required for cancellation. Early termination fees may apply for contract term commitments.</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">6. EQUIPMENT</h4>
                <p>Customer Premises Equipment (CPE) remains CircleTel property and must be returned in good condition upon service termination.</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">7. FAIR USAGE</h4>
                <p>While data is unlimited, CircleTel reserves the right to manage traffic during peak periods to ensure fair usage across all customers.</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">8. GOVERNING LAW</h4>
                <p>
                  This agreement is governed by South African law. Full terms and conditions available at{' '}
                  <a
                    href="https://www.circletel.co.za/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-circleTel-orange hover:underline font-medium"
                  >
                    www.circletel.co.za/terms
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Acceptance Section */}
        <div className="bg-gray-50 border-2 border-circleTel-orange p-6 mb-8 customer-acceptance">
          <h3 className="text-lg font-bold text-circleTel-darkNeutral mb-6 text-center">
            CUSTOMER ACCEPTANCE
          </h3>
          
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-medium mb-4">ACCEPTANCE DECLARATION</h4>
              <div className="space-y-3 text-sm">
                <label className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" disabled />
                  <span>I accept the terms and conditions as outlined above</span>
                </label>
                <label className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" disabled />
                  <span>I confirm the service address and technical requirements are correct</span>
                </label>
                <label className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" disabled />
                  <span>I authorize CircleTel to proceed with installation</span>
                </label>
                <label className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" disabled />
                  <span>I have authority to sign on behalf of the company</span>
                </label>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">SIGNATURE</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Authorized Signatory Name:</label>
                  <div className="border-b border-gray-400 h-8"></div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Position/Title:</label>
                  <div className="border-b border-gray-400 h-8"></div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Date:</label>
                  <div className="border-b border-gray-400 h-8"></div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Signature:</label>
                  <div className="border-2 border-dashed border-gray-400 h-16 flex items-center justify-center text-gray-500 text-xs">
                    Sign Here
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-300 text-center">
            <button className="bg-circleTel-orange text-white px-8 py-3 rounded font-medium hover:bg-orange-600 transition-colors print:hidden">
              ACCEPT QUOTE & PROCEED TO ORDER
            </button>
            <div className="hidden print:block text-sm text-gray-600">
              This quote can be accepted digitally via the online portal or manually signed and returned.
            </div>
          </div>
        </div>

        {/* Professional Footer */}
        <div className="border-t-2 border-circleTel-orange pt-6 text-center footer-section">
          <div className="grid grid-cols-3 gap-8 text-xs">
            <div>
              <h4 className="font-medium mb-2">HEAD OFFICE</h4>
              <p>CircleTel (Pty) Ltd<br />
              Registration: 2020/123456/07<br />
              VAT: 4123456789</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">CONTACT</h4>
              <p>Tel: +27 87 087 6305<br />
              Email: quotes@circletel.co.za<br />
              Web: www.circletel.co.za</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">SUPPORT</h4>
              <p>24/7 NOC: support@circletel.co.za<br />
              Business Hours: 08:00 - 17:00<br />
              Emergency: +27 87 087 6305</p>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-300">
            <p className="text-xs text-gray-600">
              Thank you for choosing CircleTel as your telecommunications partner. 
              We look forward to delivering exceptional connectivity solutions for your business.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
