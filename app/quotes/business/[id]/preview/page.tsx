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
  Check
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
    <div className="min-h-screen bg-circleTel-lightNeutral py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-circleTel-darkNeutral mb-2">
                {quote.quote_number}
              </h1>
              <p className="text-circleTel-secondaryNeutral">
                Quote for {quote.company_name}
              </p>
            </div>
            <Badge className={`${getStatusColor(quote.status)} text-white`}>
              {formatStatus(quote.status)}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-circleTel-secondaryNeutral">Quote Date</p>
              <p className="font-medium">{formatDate(quote.created_at)}</p>
            </div>
            {quote.valid_until && (
              <div>
                <p className="text-circleTel-secondaryNeutral">Valid Until</p>
                <p className="font-medium">{formatDate(quote.valid_until)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-circleTel-orange" />
                  Company Information
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
                  <User className="w-5 h-5 text-circleTel-orange" />
                  Contact Details
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
                  <FileText className="w-5 h-5 text-circleTel-orange" />
                  Services ({quote.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {quote.items.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-circleTel-darkNeutral">{item.service_name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {item.item_type}
                            </Badge>
                          </div>
                          <div className="text-sm text-circleTel-secondaryNeutral space-y-1">
                            <p>Speed: {item.speed_down}Mbps ↓ / {item.speed_up}Mbps ↑</p>
                            {item.data_cap_gb ? (
                              <p>Data Cap: {item.data_cap_gb}GB</p>
                            ) : (
                              <p>Data: Unlimited</p>
                            )}
                            <p>Quantity: {item.quantity}</p>
                            {item.notes && <p className="italic mt-1">Note: {item.notes}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            {formatCurrency(item.monthly_price * item.quantity)}
                            <span className="text-sm font-normal text-circleTel-secondaryNeutral">/mo</span>
                          </p>
                          {item.installation_price > 0 && (
                            <p className="text-sm text-circleTel-secondaryNeutral mt-1">
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

            {/* Notes */}
            {quote.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-circleTel-secondaryNeutral whitespace-pre-wrap">{quote.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Summary */}
            <Card className="border-circleTel-orange border-2">
              <CardHeader className="bg-gradient-to-r from-circleTel-orange to-[#e67516] text-white">
                <CardTitle>Pricing Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
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

            {/* Quote Info */}
            <Card>
              <CardHeader>
                <CardTitle>Quote Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-circleTel-orange" />
                  <div>
                    <p className="text-circleTel-secondaryNeutral">Created</p>
                    <p className="font-medium">{formatDate(quote.created_at)}</p>
                  </div>
                </div>
                {quote.valid_until && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-circleTel-orange" />
                    <div>
                      <p className="text-circleTel-secondaryNeutral">Valid Until</p>
                      <p className="font-medium">{formatDate(quote.valid_until)}</p>
                    </div>
                  </div>
                )}
                {quote.prepared_by && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-circleTel-orange" />
                    <div>
                      <p className="text-circleTel-secondaryNeutral">Prepared By</p>
                      <p className="font-medium">{quote.prepared_by}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-sm text-circleTel-secondaryNeutral mb-2">
            Thank you for considering CircleTel for your business needs.
          </p>
          <p className="text-sm text-circleTel-secondaryNeutral">
            For questions about this quote, please contact us at{' '}
            <a href="mailto:quotes@circletel.co.za" className="text-circleTel-orange hover:underline font-medium">
              quotes@circletel.co.za
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
