'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, Mail, Phone, MapPin, Calendar, FileText, Package } from 'lucide-react';

interface QuotePreviewProps {
  formData: {
    company_name: string;
    registration_number?: string;
    vat_number?: string;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    service_address: string;
    contract_term: string;
    custom_discount_percent?: number;
    customer_notes?: string;
  };
  items: Array<{
    package: {
      name: string;
      speed: string;
      pricing: {
        monthly: number;
        installation: number;
      };
    };
    quantity: number;
    item_type: string;
  }>;
  mtnDeals?: Array<{
    deal_name: string;
    contract_term: number;
    total_data?: string;
    total_minutes?: string;
    sms_bundle?: string;
  }>;
  pricing: {
    subtotalMonthly: number;
    subtotalInstallation: number;
    discountPercent: number;
    discountAmount: number;
    afterDiscount: number;
    vat: number;
    total: number;
  };
}

export function QuotePreview({ formData, items, mtnDeals, pricing }: QuotePreviewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const today = new Date().toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="max-w-5xl mx-auto bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#F5831F] to-[#e67516] p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Business Quote</h1>
            <p className="text-lg opacity-90">Professional Connectivity Solutions</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-extrabold">CircleTel</div>
            <p className="text-sm opacity-90 mt-1">Your Trusted Partner</p>
          </div>
        </div>
      </div>

      {/* Quote Info Bar */}
      <div className="bg-gray-100 px-8 py-4 border-b-4 border-[#F5831F]">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Quote Date
            </p>
            <p className="font-semibold text-gray-900">{today}</p>
          </div>
          <div>
            <p className="text-gray-600 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Valid Until
            </p>
            <p className="font-semibold text-gray-900">{validUntil}</p>
          </div>
          <div>
            <p className="text-gray-600 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Contract Term
            </p>
            <p className="font-semibold text-gray-900">{formData.contract_term} Months</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Customer Information */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#F5831F]" />
            Customer Information
          </h2>
          <Card className="p-6 bg-gray-50">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-4">{formData.company_name}</h3>
                {formData.registration_number && (
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-semibold">Registration:</span> {formData.registration_number}
                  </p>
                )}
                {formData.vat_number && (
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-semibold">VAT Number:</span> {formData.vat_number}
                  </p>
                )}
              </div>
              <div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-[#F5831F] mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Contact Person</p>
                      <p className="font-semibold text-gray-900">{formData.contact_name}</p>
                      <p className="text-sm text-gray-600">{formData.contact_email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-[#F5831F] mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="font-semibold text-gray-900">{formData.contact_phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#F5831F] mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Service Address</p>
                      <p className="font-semibold text-gray-900">{formData.service_address}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* MTN Deals Summary (if applicable) */}
        {mtnDeals && mtnDeals.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">MTN Business Deals</h2>
            {mtnDeals.map((deal, index) => (
              <Card key={index} className="p-6 mb-4 border-2 border-[#F5831F] bg-orange-50">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{deal.deal_name}</h3>
                    <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                      {deal.total_data && (
                        <div>
                          <p className="text-gray-600">Data Allowance</p>
                          <p className="font-semibold text-gray-900">{deal.total_data}</p>
                        </div>
                      )}
                      {deal.total_minutes && (
                        <div>
                          <p className="text-gray-600">Voice Minutes</p>
                          <p className="font-semibold text-gray-900">{deal.total_minutes}</p>
                        </div>
                      )}
                      {deal.sms_bundle && (
                        <div>
                          <p className="text-gray-600">SMS Bundle</p>
                          <p className="font-semibold text-gray-900">{deal.sms_bundle}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge className="bg-[#F5831F] text-white">
                    {deal.contract_term}-Month Contract
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Services & Pricing */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Services & Pricing</h2>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-900 text-white grid grid-cols-12 gap-4 px-6 py-4 font-semibold">
              <div className="col-span-6">Service Description</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-right">Monthly</div>
              <div className="col-span-2 text-right">Setup Fee</div>
            </div>

            {/* Table Rows */}
            {items.map((item, index) => (
              <div
                key={index}
                className={`grid grid-cols-12 gap-4 px-6 py-4 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <div className="col-span-6">
                  <p className="font-semibold text-gray-900">{item.package.name}</p>
                  <p className="text-sm text-gray-600">{item.package.speed}</p>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {item.item_type}
                  </Badge>
                </div>
                <div className="col-span-2 text-center font-medium text-gray-900">
                  {item.quantity}
                </div>
                <div className="col-span-2 text-right font-semibold text-gray-900">
                  {formatCurrency(item.package.pricing.monthly * item.quantity)}
                </div>
                <div className="col-span-2 text-right font-semibold text-gray-900">
                  {formatCurrency(item.package.pricing.installation * item.quantity)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="grid grid-cols-3 gap-8 mb-8">
          <div className="col-span-2">
            {formData.customer_notes && (
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Additional Notes</h3>
                <p className="text-sm text-gray-700 bg-blue-50 p-4 rounded border border-blue-200">
                  {formData.customer_notes}
                </p>
              </div>
            )}
          </div>
          <div>
            <Card className="p-6 bg-gray-50">
              <h3 className="font-bold text-gray-900 mb-4">Quote Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Monthly Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(pricing.subtotalMonthly)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Setup Fees:</span>
                  <span className="font-semibold">{formatCurrency(pricing.subtotalInstallation)}</span>
                </div>
                
                {pricing.discountAmount > 0 && (
                  <>
                    <Separator />
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount ({pricing.discountPercent}%):</span>
                      <span className="font-semibold">-{formatCurrency(pricing.discountAmount)}</span>
                    </div>
                  </>
                )}
                
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(pricing.afterDiscount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">VAT (15%):</span>
                  <span className="font-semibold">{formatCurrency(pricing.vat)}</span>
                </div>
                
                <Separator className="my-3" />
                
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900">Total (Incl. VAT):</span>
                  <span className="text-[#F5831F]">{formatCurrency(pricing.total)}</span>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-4">
                  <p className="text-xs font-semibold text-blue-900 mb-1">Monthly Recurring:</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(pricing.subtotalMonthly * 1.15)}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="mb-8">
          <h3 className="font-bold text-gray-900 mb-3">Terms & Conditions</h3>
          <div className="text-sm text-gray-700 space-y-2 bg-gray-50 p-6 rounded border border-gray-200">
            <p>• This quote is valid for 30 days from the date of issue.</p>
            <p>• Pricing is subject to change based on service availability and location verification.</p>
            <p>• Installation is subject to technical feasibility and may require a site survey.</p>
            <p>• Monthly fees are billed in advance and are subject to annual CPI increases.</p>
            <p>• A {formData.contract_term}-month contract commitment applies to this quote.</p>
            <p>• Early termination fees may apply if the contract is cancelled before the end of the term.</p>
            <p>• All prices include 15% VAT unless otherwise stated.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white p-8">
        <div className="grid grid-cols-3 gap-8 text-sm">
          <div>
            <h4 className="font-bold mb-3 text-[#F5831F]">Contact Us</h4>
            <p className="mb-1">TEL: +27 87 087 6305</p>
            <p className="mb-1">Email: contactus@circletel.co.za</p>
            <p>Web: www.circletel.co.za</p>
          </div>
          <div>
            <h4 className="font-bold mb-3 text-[#F5831F]">Physical Address</h4>
            <p>West House, Devcon Park</p>
            <p>7 Autumn Road, Rivonia</p>
            <p>2128, South Africa</p>
          </div>
          <div>
            <h4 className="font-bold mb-3 text-[#F5831F]">Postal Address</h4>
            <p>PO Box 3895</p>
            <p>Rivonia, 2128</p>
            <p>South Africa</p>
          </div>
        </div>
        <Separator className="my-6 bg-gray-700" />
        <p className="text-center text-xs text-gray-400">
          © {new Date().getFullYear()} CircleTel. All rights reserved. | Trusted connectivity solutions for South African businesses.
        </p>
      </div>
    </div>
  );
}
