'use client';

import { useState } from 'react';
import { Calculator, TrendingUp, Banknote, Users } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

// Simplified commission rate - 30% recurring
const COMMISSION_RATE = 0.30;

function calculateCommission(packageValue: number, numCustomers: number): {
  monthlyCommission: number;
  yearlyCommission: number;
  fiveYearTotal: number;
} {
  const monthlyCommission = packageValue * COMMISSION_RATE * numCustomers;
  const yearlyCommission = monthlyCommission * 12;
  const fiveYearTotal = yearlyCommission * 5;

  return {
    monthlyCommission,
    yearlyCommission,
    fiveYearTotal,
  };
}

export function CommissionCalculator() {
  const [packageValue, setPackageValue] = useState(699);
  const [numCustomers, setNumCustomers] = useState(10);

  const result = calculateCommission(packageValue, numCustomers);

  return (
    <section id="commission-calculator" className="py-16 bg-circleTel-orange text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl lg:text-4xl font-black mb-4">
            See what you could earn
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto">
            Drag the sliders to calculate your potential monthly income
          </p>
        </div>

        {/* Calculator Card */}
        <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-2xl max-w-3xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left - Inputs */}
            <div className="space-y-6">
              {/* Package Value Slider */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-600">
                    Average package value
                  </label>
                  <div className="text-xl font-black text-circleTel-orange">
                    R{packageValue}
                  </div>
                </div>
                <Slider
                  value={[packageValue]}
                  onValueChange={(value) => setPackageValue(value[0])}
                  min={399}
                  max={1999}
                  step={100}
                  className="mb-2"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>R399</span>
                  <span>R1,999</span>
                </div>
              </div>

              {/* Number of Customers Slider */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-600">
                    Customers you refer
                  </label>
                  <div className="text-xl font-black text-circleTel-orange">
                    {numCustomers}
                  </div>
                </div>
                <Slider
                  value={[numCustomers]}
                  onValueChange={(value) => setNumCustomers(value[0])}
                  min={1}
                  max={50}
                  step={1}
                  className="mb-2"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>1</span>
                  <span>50</span>
                </div>
              </div>

              {/* Commission Rate Badge */}
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">30%</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong className="text-gray-900">Recurring commission</strong> on every customer, every month
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Results */}
            <div className="flex flex-col justify-center">
              {/* Monthly Earnings */}
              <div className="text-center mb-6">
                <div className="text-sm font-semibold text-gray-500 mb-2">
                  Your monthly earnings
                </div>
                <div className="text-5xl lg:text-6xl font-black text-gray-900">
                  R{result.monthlyCommission.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <div className="text-gray-500 mt-2">per month</div>
              </div>

              {/* Yearly & 5-Year */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-xs font-semibold text-gray-500 mb-1">Per year</div>
                  <div className="text-xl font-bold text-gray-900">
                    R{result.yearlyCommission.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="bg-circleTel-orange/10 rounded-xl p-4 text-center">
                  <div className="text-xs font-semibold text-circleTel-orange mb-1">Over 5 years</div>
                  <div className="text-xl font-bold text-circleTel-orange">
                    R{result.fiveYearTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Note */}
        <p className="text-center text-white/70 text-sm mt-6">
          * Based on 30% recurring commission. Actual earnings depend on customer retention.
        </p>
      </div>
    </section>
  );
}
