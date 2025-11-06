import React, { useState } from 'react'
import { Check, Info, Star } from 'lucide-react'

interface PricingTier {
  name: string
  cpu: string
  ram: string
  storage: string
  bandwidth: string
  price: number
  priceLabel: string
  isPopular?: boolean
}

interface PricingPlan {
  planType: 'managed' | 'self-managed'
  title: string
  description: string
  tiers: PricingTier[]
}

interface PricingTablesProps {
  plans?: PricingPlan[]
}

const defaultPlans: PricingPlan[] = [
  {
    planType: 'self-managed',
    title: 'Self-managed',
    description: 'Full control over your cloud infrastructure',
    tiers: [
      { name: 'Silver Pro', cpu: '2x2', ram: '2 GB', storage: '40GB SSD', bandwidth: 'Unmetered', price: 195, priceLabel: 'R195 p/m' },
      { name: 'Gold', cpu: '3x3', ram: '3 GB', storage: '60GB SSD', bandwidth: 'Unmetered', price: 295, priceLabel: 'R295 p/m', isPopular: true },
      { name: 'Gold Pro', cpu: '4x4', ram: '4 GB', storage: '80GB SSD', bandwidth: 'Unmetered', price: 395, priceLabel: 'R395 p/m' },
      { name: 'Platinum', cpu: '6x6', ram: '6 GB', storage: '120GB SSD', bandwidth: 'Unmetered', price: 595, priceLabel: 'R595 p/m' },
      { name: 'Platinum Pro', cpu: '8x8', ram: '8 GB', storage: '160GB SSD', bandwidth: 'Unmetered', price: 795, priceLabel: 'R795 p/m' }
    ]
  },
  {
    planType: 'managed',
    title: 'Managed',
    description: 'We handle everything for you',
    tiers: [
      { name: 'Managed 1', cpu: '2x2', ram: '2 GB', storage: '40GB SSD', bandwidth: 'Unmetered', price: 495, priceLabel: 'R495 p/m' },
      { name: 'Managed 2', cpu: '3x3', ram: '3 GB', storage: '60GB SSD', bandwidth: 'Unmetered', price: 695, priceLabel: 'R695 p/m', isPopular: true },
      { name: 'Managed 3', cpu: '4x4', ram: '4 GB', storage: '80GB SSD', bandwidth: 'Unmetered', price: 895, priceLabel: 'R895 p/m' },
      { name: 'Managed 4', cpu: '6x6', ram: '6 GB', storage: '120GB SSD', bandwidth: 'Unmetered', price: 1295, priceLabel: 'R1,295 p/m' },
      { name: 'Managed 5', cpu: '8x8', ram: '8 GB', storage: '160GB SSD', bandwidth: 'Unmetered', price: 1695, priceLabel: 'R1,695 p/m' }
    ]
  }
]

export default function PricingTables({ plans = defaultPlans }: PricingTablesProps) {
  const [activeTab, setActiveTab] = useState<'self-managed' | 'managed'>('self-managed')
  const activePlan = plans.find(p => p.planType === activeTab) || defaultPlans[0]

  return (
    <section className="py-16 bg-gray-50" data-section="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tab Switcher */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-lg bg-white shadow-sm p-1">
            <button
              onClick={() => setActiveTab('self-managed')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'self-managed'
                  ? 'bg-slate-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              self-managed
            </button>
            <button
              onClick={() => setActiveTab('managed')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'managed'
                  ? 'bg-slate-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              managed
            </button>
          </div>
        </div>

        {/* Plan Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{activePlan.title} packages</h2>
          <p className="text-gray-600">{activePlan.description}</p>
        </div>

        {/* Pricing Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Package</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">CPU</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">RAM</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Storage</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Bandwidth</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Price</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activePlan.tiers.map((tier, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-900">{tier.name}</span>
                        {tier.isPopular && (
                          <span className="ml-2 px-2 py-1 bg-circleTel-orange text-white text-xs rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-700">{tier.cpu}</td>
                    <td className="px-6 py-4 text-center text-gray-700">{tier.ram}</td>
                    <td className="px-6 py-4 text-center text-gray-700">{tier.storage}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center text-green-600 font-medium">
                        <Check className="w-4 h-4 mr-1" />
                        {tier.bandwidth}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-2xl font-bold text-gray-900">{tier.priceLabel}</div>
                    </td>
                    <td className="px-6 py-4">
                      <button className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        tier.isPopular
                          ? 'bg-circleTel-orange text-white hover:bg-orange-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Additional Features */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center mb-3">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span className="font-semibold">cPanel Included</span>
            </div>
            <p className="text-sm text-gray-600">Full control panel access for easy management</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center mb-3">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span className="font-semibold">Automatic Backups</span>
            </div>
            <p className="text-sm text-gray-600">Daily backups with 30-day retention</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center mb-3">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span className="font-semibold">24/7 Support</span>
            </div>
            <p className="text-sm text-gray-600">Expert support whenever you need it</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Need a custom solution?</p>
          <button className="px-8 py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors">
            Contact Sales Team
          </button>
        </div>
      </div>
    </section>
  )
}