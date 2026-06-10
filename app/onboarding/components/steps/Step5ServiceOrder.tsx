'use client';
import { useState } from 'react';
import { step5Schema, type Step5 } from '@/lib/onboarding/schemas';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { computeProRata } from '@/lib/onboarding/prorata';
import { SERVICE_ORDER_TERMS, SERVICE_ORDER_TERMS_TITLE, SERVICE_ORDER_MSA_REFERENCE_UI } from '@/lib/onboarding/service-order-terms';
import { PiCaretDown, PiCaretUp } from 'react-icons/pi';

export interface Step5ServiceOrderProps {
  value: {
    paymentDate?: '1' | '15' | '20' | '25';
    soAccept?: boolean;
  };
  onChange: (values: {
    paymentDate?: '1' | '15' | '20' | '25';
    soAccept?: boolean;
  }) => void;
  monthlyPrice?: number;
  activationDate?: string;
  canGoNext: boolean;
}

const PAYMENT_DATES = ['1', '15', '20', '25'];

export function Step5ServiceOrder({
  value,
  onChange,
  monthlyPrice = 450,
  activationDate = new Date().toISOString().split('T')[0],
  canGoNext,
}: Step5ServiceOrderProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDetails, setShowDetails] = useState(false);

  const paymentDate = value.paymentDate ?? '1';

  const proRata = computeProRata({
    monthlyExVat: monthlyPrice,
    vatPct: 15,
    activationDate,
    billingDay: Number(paymentDate),
  });

  const handlePaymentDateChange = (date: string) => {
    const newValue = { ...value, paymentDate: date as Step5['paymentDate'] };
    onChange(newValue);
    setErrors((e) => {
      const newE = { ...e };
      delete newE.paymentDate;
      return newE;
    });
  };

  const handleConsentChange = (checked: boolean) => {
    const newValue = { ...value, soAccept: checked as any };
    onChange(newValue);
    setErrors((e) => {
      const newE = { ...e };
      delete newE.soAccept;
      return newE;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Service Order
        </h2>
        <p className="text-gray-600">
          Confirm your details, choose your monthly payment date, and accept the
          Service Order terms.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Payment Date Selection */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              When should we debit your account?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Choose the day of the month (1st, 15th, 20th, or 25th)
            </p>
            <div className="flex flex-wrap gap-3">
              {PAYMENT_DATES.map((date) => (
                <button
                  key={date}
                  onClick={() => handlePaymentDateChange(date)}
                  className={`px-6 py-3 rounded border-2 font-semibold transition ${
                    paymentDate === date
                      ? 'bg-circleTel-orange border-circleTel-orange text-white'
                      : 'bg-white border-gray-300 text-gray-900 hover:border-circleTel-orange'
                  }`}
                >
                  {date === '1' ? '1st' : date === '15' ? '15th' : date === '20' ? '20th' : '25th'}
                </button>
              ))}
            </div>
          </div>

          {/* Service Order Line Item */}
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-semibold text-gray-900">
                  CircleTel ClinicConnect
                </p>
                <p className="text-sm text-gray-600">
                  Managed connectivity service · Unjani clinic
                </p>
              </div>
            </div>

            {/* Pro-rata line */}
            <div className="border-t pt-3 flex justify-between items-center p-3 bg-white rounded border border-circleTel-orange">
              <div>
                <p className="font-semibold text-gray-900">
                  First invoice (pro-rated)
                </p>
                <p className="text-xs text-gray-600">
                  {proRata.days} days of {proRata.daysInMonth} in the month
                </p>
              </div>
              <p className="font-bold text-circleTel-orange text-xl">
                R{proRata.amountInclVat.toFixed(2)}
              </p>
            </div>

            {/* Monthly recurring */}
            <div className="mt-3 flex justify-between items-center p-3 bg-white rounded border border-gray-200">
              <div>
                <p className="font-semibold text-gray-900">Monthly recurring</p>
                <p className="text-xs text-gray-600">From the following month</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">R{monthlyPrice.toFixed(2)}</p>
                <p className="text-xs text-gray-500">ex VAT (15%)</p>
              </div>
            </div>
          </div>

          {/* Service Order Terms */}
          <div className="border rounded p-4">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center justify-between w-full font-semibold text-gray-900 hover:text-circleTel-orange"
            >
              <span>{SERVICE_ORDER_TERMS_TITLE}</span>
              {showDetails ? (
                <PiCaretUp className="w-5 h-5" />
              ) : (
                <PiCaretDown className="w-5 h-5" />
              )}
            </button>

            {showDetails && (
              <div className="mt-4 space-y-3 text-sm text-gray-700">
                {SERVICE_ORDER_TERMS.map((clause, idx) => (
                  <p key={idx} dangerouslySetInnerHTML={{ __html: clause }} />
                ))}
                <p className="text-xs text-gray-600 mt-4 pt-4 border-t">
                  {SERVICE_ORDER_MSA_REFERENCE_UI}
                </p>
              </div>
            )}
          </div>

          {/* Acceptance Checkbox */}
          <div className="flex items-start gap-3 p-4 border border-gray-200 rounded bg-gray-50">
            <Checkbox
              id="soAccept"
              checked={value.soAccept ?? false}
              onCheckedChange={(checked) => handleConsentChange(checked as boolean)}
            />
            <label htmlFor="soAccept" className="text-sm cursor-pointer flex-1">
              <span className="font-semibold">
                I accept the CircleTel Service Order terms above
              </span>
              , which are back-to-back with the Unjani Master Service Agreement,
              and I'm authorised to do so for this entity.
            </label>
          </div>
          {errors.soAccept && (
            <p className="text-xs text-red-600">{errors.soAccept}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
