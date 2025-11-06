'use client';

import { DollarSign, BarChart3, GraduationCap, Megaphone, UserCheck, TrendingUp } from 'lucide-react';

const benefits = [
  {
    icon: DollarSign,
    title: 'High Commission Rates',
    description: 'Earn up to 30% recurring revenue on every sale. Get paid monthly as long as your customers stay active — build genuine passive income.',
    color: 'from-green-500 to-emerald-600',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Partner Portal',
    description: 'Track every lead, deal, and commission payment in real-time. Full visibility into your sales pipeline and earnings history.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: GraduationCap,
    title: 'Fast-Track Onboarding',
    description: 'Get approved in 5-7 days with comprehensive training included. We will get you selling quickly with full product knowledge and sales support.',
    color: 'from-purple-500 to-pink-600',
  },
  {
    icon: Megaphone,
    title: 'Marketing Made Easy',
    description: 'Access professional brochures, email templates, social graphics, and co-branded materials. We provide everything you need to close deals.',
    color: 'from-orange-500 to-red-600',
  },
  {
    icon: UserCheck,
    title: 'Personal Account Manager',
    description: 'Every partner gets a dedicated account manager for strategic support, monthly performance reviews, and priority technical assistance.',
    color: 'from-teal-500 to-cyan-600',
  },
  {
    icon: TrendingUp,
    title: 'Build Passive Income',
    description: 'Create a sustainable business with predictable monthly cash flow. Our top partners earn R45,000+ per month in recurring commissions.',
    color: 'from-yellow-500 to-orange-600',
  },
];

export function BenefitCards() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-circleTel-darkNeutral mb-4">
            Why Join Our Partner Network?
          </h2>
          <p className="text-xl text-circleTel-secondaryNeutral max-w-3xl mx-auto">
            We're actively recruiting motivated partners. Here's what makes CircleTel the best opportunity in South Africa's ISP market
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${benefit.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                {/* Icon */}
                <div className="relative">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${benefit.color} mb-6 shadow-lg`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-3">
                    {benefit.title}
                  </h3>

                  {/* Description */}
                  <p className="text-circleTel-secondaryNeutral leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
