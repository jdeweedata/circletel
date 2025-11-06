'use client';

import { Check } from 'lucide-react';

const tiers = [
  { tier: 1, name: 'Starter', min: 0, max: 99, rate: '1.43%', monthly: 'R0 - R99', color: 'from-gray-500 to-gray-600' },
  { tier: 2, name: 'Bronze', min: 100, max: 249, rate: '1.73%', monthly: 'R100 - R249', color: 'from-amber-700 to-amber-800' },
  { tier: 3, name: 'Silver', min: 250, max: 349, rate: '2.18%', monthly: 'R250 - R349', color: 'from-gray-400 to-gray-500' },
  { tier: 4, name: 'Premium', min: 350, max: 999, rate: '2.63%', monthly: 'R350 - R999', color: 'from-blue-500 to-blue-600', highlighted: true },
  { tier: 5, name: 'Gold', min: 1000, max: 1499, rate: '2.93%', monthly: 'R1,000 - R1,499', color: 'from-yellow-500 to-yellow-600' },
  { tier: 6, name: 'Platinum', min: 1500, max: 1999, rate: '3.53%', monthly: 'R1,500 - R1,999', color: 'from-purple-500 to-purple-600' },
  { tier: 7, name: 'Enterprise', min: 2000, max: null, rate: '4.13%', monthly: 'R2,000+', color: 'from-emerald-500 to-emerald-600' },
];

export function CommissionStructure() {
  return (
    <section id="commission-structure" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-circleTel-darkNeutral mb-4">
            Commission Structure
          </h2>
          <p className="text-xl text-circleTel-secondaryNeutral max-w-3xl mx-auto">
            Transparent, tiered commission rates based on monthly package value
          </p>
        </div>

        {/* Tiers Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {tiers.map((tier) => (
            <div
              key={tier.tier}
              className={`relative rounded-2xl p-6 border-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${
                tier.highlighted
                  ? 'border-circleTel-orange bg-gradient-to-br from-circleTel-orange/5 to-orange-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-circleTel-orange/30'
              }`}
            >
              {/* Popular Badge */}
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-circleTel-orange text-white text-xs font-bold shadow-md">
                  MOST POPULAR
                </div>
              )}

              {/* Tier Number */}
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${tier.color} text-white font-bold text-lg mb-4 shadow-md`}>
                {tier.tier}
              </div>

              {/* Tier Name */}
              <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-2">
                {tier.name}
              </h3>

              {/* Commission Rate */}
              <div className="mb-4">
                <div className="text-3xl font-extrabold text-circleTel-orange mb-1">
                  {tier.rate}
                </div>
                <div className="text-sm text-circleTel-secondaryNeutral">
                  Commission Rate
                </div>
              </div>

              {/* Monthly Value Range */}
              <div className="py-3 px-4 rounded-lg bg-gray-50 border border-gray-200 mb-4">
                <div className="text-xs font-semibold text-circleTel-secondaryNeutral mb-1">
                  Monthly Value
                </div>
                <div className="text-lg font-bold text-circleTel-darkNeutral">
                  {tier.monthly}
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm text-circleTel-secondaryNeutral">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Recurring commission</span>
                </div>
                {tier.tier >= 4 && (
                  <div className="flex items-start gap-2 text-sm text-circleTel-secondaryNeutral">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Priority support</span>
                  </div>
                )}
                {tier.tier >= 6 && (
                  <div className="flex items-start gap-2 text-sm text-circleTel-secondaryNeutral">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Dedicated manager</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Example Calculation */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border-2 border-gray-200">
          <h3 className="text-2xl font-bold text-circleTel-darkNeutral mb-6 text-center">
            Example Calculation
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-sm font-semibold text-circleTel-secondaryNeutral mb-2">
                Monthly Package Value
              </div>
              <div className="text-3xl font-bold text-circleTel-darkNeutral">
                R799
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-circleTel-secondaryNeutral mb-2">
                Commission Rate (Tier 4)
              </div>
              <div className="text-3xl font-bold text-circleTel-orange">
                2.63%
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-circleTel-secondaryNeutral mb-2">
                Your Monthly Earning
              </div>
              <div className="text-3xl font-bold text-green-600">
                R21.01
              </div>
            </div>
          </div>
          <div className="mt-6 text-center">
            <p className="text-sm text-circleTel-secondaryNeutral">
              Multiply by your customer base to see your total potential. With 50 customers at R799/month, you earn <strong className="text-circleTel-orange">R1,050.50/month</strong> in recurring commission.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
