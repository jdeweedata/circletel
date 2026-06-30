'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { PiCheckCircleBold, PiFileTextBold, PiSpinnerGapBold } from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface ServiceOrderSignoffClientProps {
  token: string;
  businessName: string;
  accountNumber: string;
  serviceName: string;
  monthlyFeeExVat: number;
  billingDay: string;
  activationDate: string;
  terms: string[];
  serviceReference: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function ServiceOrderSignoffClient({
  token,
  businessName,
  accountNumber,
  serviceName,
  monthlyFeeExVat,
  billingDay,
  activationDate,
  terms,
  serviceReference,
}: ServiceOrderSignoffClientProps) {
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);

  async function handleAccept() {
    setSubmitting(true);
    try {
      const response = await fetch('/api/service-order/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Service Order signoff failed');
      }
      setComplete(true);
      toast.success('Service Order accepted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Service Order signoff failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (complete) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="space-y-4 pt-6 text-center">
          <PiCheckCircleBold className="mx-auto h-12 w-12 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Service Order Accepted</h1>
            <p className="mt-2 text-gray-700">
              CircleTel has recorded the acceptance for {accountNumber}.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-md border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-semibold text-[#AE5B16]">
          <PiFileTextBold className="h-4 w-4" />
          Service Order
        </div>
        <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">{businessName}</h1>
        <p className="text-gray-600">{accountNumber}</p>
      </div>

      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Service</p>
            <p className="mt-1 font-semibold text-gray-900">{serviceName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Monthly fee</p>
            <p className="mt-1 font-semibold text-gray-900">
              {formatCurrency(monthlyFeeExVat)} ex VAT
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Billing day</p>
            <p className="mt-1 font-semibold text-gray-900">{billingDay}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Activation date</p>
            <p className="mt-1 font-semibold text-gray-900">{activationDate}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h2 className="text-xl font-bold text-gray-900">Terms And Conditions</h2>
          <ol className="space-y-3 text-sm leading-6 text-gray-700">
            {terms.map((term, index) => (
              <li key={term} className="grid grid-cols-[28px_minmax(0,1fr)] gap-2">
                <span className="font-semibold text-gray-500">{index + 1}.</span>
                <span>{term}</span>
              </li>
            ))}
          </ol>
          <p className="border-t border-gray-100 pt-4 text-sm text-gray-600">{serviceReference}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-start gap-3">
            <Checkbox
              id="service-order-accept"
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked === true)}
              className="mt-1"
            />
            <Label htmlFor="service-order-accept" className="text-sm leading-6 text-gray-700">
              I am authorised to accept this Service Order and debit-order mandate for {businessName}.
            </Label>
          </div>
          <Button onClick={handleAccept} disabled={!accepted || submitting} className="w-full sm:w-auto">
            {submitting ? (
              <>
                <PiSpinnerGapBold className="mr-2 h-4 w-4 animate-spin" />
                Accepting...
              </>
            ) : (
              'Accept Service Order'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
