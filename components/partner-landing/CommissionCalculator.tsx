'use client';

import { useState } from 'react';
import { Calculator, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

// Tier structure from Commission Structure document
const COMMISSION_TIERS = [
  { tier: 1, min: 0, max: 99, rate: 0.0143, name: 'Starter' },
  { tier: 2, min: 100, max: 249, rate: 0.0173, name: 'Bronze' },
  { tier: 3, min: 250, max: 349, rate: 0.0218, name: 'Silver' },
  { tier: 4, min: 350, max: 999, rate: 0.0263, name: 'Premium' },
  { tier: 5, min: 1000, max: 1499, rate: 0.0293, name: 'Gold' },
  { tier: 6, min: 1500, max: 1999, rate: 0.0353, name: 'Platinum' },
  { tier: 7, min: 2000, max: Infinity, rate: 0.0413, name: 'Enterprise' },
];

function calculateCommission(monthlyValue: number, termMonths: number): {
  tier: typeof COMMISSION_TIERS[0];
  totalContractValue: number;
  totalCommission: number;
  monthlyEquivalent: number;
  fiveYearLTV: number;
} {
  // Find applicable tier
  const tier = COMMISSION_TIERS.find(t => monthlyValue >= t.min && monthlyValue <= t.max) || COMMISSION_TIERS[0];

  // Calculate values
  const totalContractValue = monthlyValue * termMonths;
  const totalCommission = totalContractValue * tier.rate;
  const monthlyEquivalent = totalCommission / termMonths;
  const fiveYearLTV = monthlyEquivalent * 60; // 5 years = 60 months

  return {
    tier,
    totalContractValue,
    totalCommission,
    monthlyEquivalent,
    fiveYearLTV,
  };
}

export function CommissionCalculator() {
  const [monthlyValue, setMonthlyValue] = useState(799);
  const [termMonths, setTermMonths] = useState(24);

  const result = calculateCommission(monthlyValue, termMonths);

  return (
    <section id="commission-calculator" className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-circleTel-orange/10 border border-circleTel-orange/20 text-circleTel-orange mb-4">
            <Calculator className="h-4 w-4" />
            <span className="text-sm font-semibold">Interactive Calculator</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-circleTel-darkNeutral mb-4">
            Calculate Your Potential Earnings
          </h2>
          <p className="text-xl text-circleTel-secondaryNeutral max-w-3xl mx-auto">
            See how much you can earn with our tiered commission structure
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Calculator Inputs */}
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
            <h3 className="text-2xl font-bold text-circleTel-darkNeutral mb-6">
              Package Details
            </h3>

            {/* Monthly Value Slider */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-circleTel-secondaryNeutral">
                  Monthly Package Value
                </label>
                <div className="text-2xl font-bold text-circleTel-orange">
                  R{monthlyValue.toLocaleString()}
                </div>
              </div>
              <Slider
                value={[monthlyValue]}
                onValueChange={(value) => setMonthlyValue(value[0])}
                min={99}
                max={3000}
                step={50}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>R99</span>
                <span>R3,000</span>
              </div>
            </div>

            {/* Contract Term */}
            <div className="mb-8">
              <label className="text-sm font-semibold text-circleTel-secondaryNeutral mb-3 block">
                Contract Term
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[12, 24, 36].map((months) => (
                  <button
                    key={months}
                    onClick={() => setTermMonths(months)}
                    className={`py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                      termMonths === months
                        ? 'bg-circleTel-orange text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-circleTel-secondaryNeutral hover:bg-gray-200'
                    }`}
                  >
                    {months} months
                  </button>
                ))}
              </div>
            </div>

            {/* Tier Badge */}
            <div className="bg-gradient-to-br from-circleTel-orange/10 to-orange-100/50 rounded-xl p-6 border-2 border-circleTel-orange/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-circleTel-secondaryNeutral mb-1">
                    Commission Tier
                  </div>
                  <div className="text-2xl font-bold text-circleTel-orange">
                    Tier {result.tier.tier} - {result.tier.name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-circleTel-secondaryNeutral mb-1">
                    Rate
                  </div>
                  <div className="text-2xl font-bold text-circleTel-darkNeutral">
                    {(result.tier.rate * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {/* Total Commission */}
            <div className="bg-gradient-to-br from-circleTel-orange to-orange-600 text-white rounded-2xl p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <DollarSign className="h-8 w-8" />
                <div className="text-lg font-semibold">Total Commission</div>
              </div>
              <div className="text-5xl font-extrabold mb-2">
                R{result.totalCommission.toFixed(2)}
              </div>
              <div className="text-white/80">
                On R{result.totalContractValue.toLocaleString()} contract value
              </div>
            </div>

            {/* Monthly Equivalent */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-circleTel-secondaryNeutral">
                      Monthly Equivalent
                    </div>
                    <div className="text-2xl font-bold text-circleTel-darkNeutral">
                      R{result.monthlyEquivalent.toFixed(2)}/mo
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 5-Year LTV */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-circleTel-secondaryNeutral">
                      5-Year Lifetime Value
                    </div>
                    <div className="text-2xl font-bold text-circleTel-darkNeutral">
                      R{result.fiveYearLTV.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-circleTel-darkNeutral mb-1">
                    Recurring Commission Model
                  </h4>
                  <p className="text-sm text-circleTel-secondaryNeutral">
                    You earn commission every month for as long as the customer stays active. The values shown assume a 5-year customer lifetime.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
