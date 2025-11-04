'use client';

import React, { useState, useEffect, use } from 'react';
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
  Printer
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
      {/* Print Button - Only show on screen */}
      <div className="print:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => window.print()}
          className="bg-circleTel-orange text-white px-4 py-2 rounded-lg shadow-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          Print Quote
        </button>
      </div>
      
      <div className="max-w-4xl mx-auto p-8 print:p-0 print:max-w-none">
        {/* Professional Header - Matching PDF */}
        <div className="bg-white mb-8">
          {/* Company Header */}
          <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-circleTel-orange">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-circleTel-orange rounded-full flex items-center justify-center mr-4">
                <span className="text-white font-bold text-2xl">C</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-circleTel-darkNeutral">CircleTel</h1>
                <p className="text-circleTel-secondaryNeutral text-sm">
                  Enterprise Telecommunications Solutions
                </p>
              </div>
            </div>
            <div className="text-right text-sm text-circleTel-secondaryNeutral">
              <div className="mb-1">
                <strong>Tel:</strong> +27 87 087 6305
              </div>
              <div className="mb-1">
                <strong>Email:</strong> quotes@circletel.co.za
              </div>
              <div>
                <strong>Web:</strong> www.circletel.co.za
              </div>
            </div>
          </div>

          {/* Quote Header */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">QUOTE</h2>
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <span className="font-medium w-24">Quote No:</span>
                  <span className="text-circleTel-orange font-bold">{quote.quote_number}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-24">Date:</span>
                  <span>{formatDate(quote.created_at)}</span>
                </div>
                {quote.valid_until && (
                  <div className="flex">
                    <span className="font-medium w-24">Valid Until:</span>
                    <span>{formatDate(quote.valid_until)}</span>
                  </div>
                )}
                <div className="flex">
                  <span className="font-medium w-24">Status:</span>
                  <Badge className={`${getStatusColor(quote.status)} text-white text-xs`}>
                    {formatStatus(quote.status)}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-xs text-gray-600 mb-2">PREPARED FOR:</p>
                <p className="font-bold text-lg text-circleTel-darkNeutral">{quote.company_name}</p>
                <p className="text-sm text-gray-600">{quote.contact_name}</p>
                <p className="text-sm text-gray-600">{quote.contact_email}</p>
                <p className="text-sm text-gray-600">{quote.contact_phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Details Section */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-bold text-circleTel-darkNeutral mb-4 border-b border-gray-300 pb-2">
              CUSTOMER DETAILS
            </h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="font-medium">Company:</span>
                <span className="col-span-2">{quote.company_name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-medium">Contact Person:</span>
                <span className="col-span-2">{quote.contact_name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-medium">Email:</span>
                <span className="col-span-2 text-circleTel-orange">{quote.contact_email}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-medium">Phone:</span>
                <span className="col-span-2">{quote.contact_phone}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-medium">Service Address:</span>
                <span className="col-span-2">{quote.service_address}</span>
              </div>
              {quote.registration_number && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium">Reg Number:</span>
                  <span className="col-span-2">{quote.registration_number}</span>
                </div>
              )}
              {quote.vat_number && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium">VAT Number:</span>
                  <span className="col-span-2">{quote.vat_number}</span>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-circleTel-darkNeutral mb-4 border-b border-gray-300 pb-2">
              SERVICE SUMMARY
            </h3>
            <div className="bg-gray-50 p-4 rounded">
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium">Customer Type:</span>
                  <span className="col-span-2 capitalize">{quote.customer_type}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium">Contract Term:</span>
                  <span className="col-span-2">{quote.contract_term} months</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium">Services:</span>
                  <span className="col-span-2">{quote.items.length} package(s)</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium">Monthly Total:</span>
                  <span className="col-span-2 font-bold text-circleTel-orange">
                    {formatCurrency(pricing.total_monthly)}
                  </span>
                </div>
                {quote.prepared_by && (
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-medium">Prepared By:</span>
                    <span className="col-span-2">{quote.prepared_by}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Service Package Details Table */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-circleTel-darkNeutral mb-4 border-b border-gray-300 pb-2">
            SERVICE PACKAGE DETAILS
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-3 text-left font-medium text-sm">Service Description</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-medium text-sm">Qty</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-medium text-sm">Speed</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-medium text-sm">Data</th>
                  <th className="border border-gray-300 px-4 py-3 text-right font-medium text-sm">Monthly (Excl. VAT)</th>
                  <th className="border border-gray-300 px-4 py-3 text-right font-medium text-sm">Installation (Excl. VAT)</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="border border-gray-300 px-4 py-3">
                      <div>
                        <div className="font-medium text-circleTel-darkNeutral">{item.service_name}</div>
                        <div className="text-xs text-gray-600 capitalize">{item.item_type}</div>
                        {item.notes && (
                          <div className="text-xs text-gray-500 italic mt-1">{item.notes}</div>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center">{item.quantity}</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      {item.speed_down}↓/{item.speed_up}↑ Mbps
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      {item.data_cap_gb ? `${item.data_cap_gb}GB` : 'Unlimited'}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right font-mono">
                      {formatCurrency(item.monthly_price * item.quantity)}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right font-mono">
                      {formatCurrency(item.installation_price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing Breakdown */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-bold text-circleTel-darkNeutral mb-4 border-b border-gray-300 pb-2">
              PRICING BREAKDOWN
            </h3>
            
            {/* Monthly Recurring */}
            <div className="mb-6">
              <h4 className="font-medium text-circleTel-darkNeutral mb-3 text-sm uppercase tracking-wide">
                Monthly Recurring Costs
              </h4>
              <div className="bg-gray-50 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal (Excl. VAT):</span>
                  <span className="font-mono">{formatCurrency(pricing.subtotal_monthly)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (15%):</span>
                  <span className="font-mono">{formatCurrency(pricing.vat_amount_monthly)}</span>
                </div>
                <div className="border-t border-gray-300 pt-2 flex justify-between font-bold">
                  <span>Monthly Total (Incl. VAT):</span>
                  <span className="font-mono text-circleTel-orange">{formatCurrency(pricing.total_monthly)}</span>
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

            {/* Contract Summary */}
            <div>
              <h4 className="font-medium text-circleTel-darkNeutral mb-3 text-sm uppercase tracking-wide">
                Contract Summary
              </h4>
              <div className="bg-circleTel-orange bg-opacity-10 border border-circleTel-orange p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Contract Term:</span>
                  <span className="font-bold">{quote.contract_term} months</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Contract Value:</span>
                  <span className="font-bold text-lg text-circleTel-orange">
                    {formatCurrency(pricing.total_monthly * quote.contract_term + pricing.total_installation)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-circleTel-darkNeutral mb-4 border-b border-gray-300 pb-2">
              INCLUSIVE BENEFITS
            </h3>
            <div className="space-y-3 text-sm">
              {generateInclusiveBenefits(quote.items).map((benefit, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            {/* Additional Notes */}
            {quote.notes && (
              <div className="mt-6">
                <h4 className="font-medium text-circleTel-darkNeutral mb-3 text-sm uppercase tracking-wide">
                  Additional Notes
                </h4>
                <div className="bg-yellow-50 border border-yellow-200 p-4 text-sm">
                  <p className="whitespace-pre-wrap">{quote.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="mb-8">
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
                <p>This agreement is governed by South African law. Full terms and conditions available at www.circletel.co.za/terms</p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Acceptance Section */}
        <div className="bg-gray-50 border-2 border-circleTel-orange p-6 mb-8">
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
              <h4 className="font-medium mb-4">DIGITAL SIGNATURE</h4>
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
                  <label className="block text-xs font-medium mb-1">Digital Signature:</label>
                  <div className="border-2 border-dashed border-gray-400 h-16 flex items-center justify-center text-gray-500 text-xs">
                    Click here to sign digitally
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
              This quote requires digital acceptance. Please visit the online version to proceed.
            </div>
          </div>
        </div>

        {/* Professional Footer */}
        <div className="border-t-2 border-circleTel-orange pt-6 text-center">
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
