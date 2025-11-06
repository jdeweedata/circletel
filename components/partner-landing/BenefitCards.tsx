'use client';

import { DollarSign, BarChart3, GraduationCap, Megaphone, UserCheck, TrendingUp } from 'lucide-react';

const benefits = [
  {
    icon: DollarSign,
    title: 'Tiered Commissions',
    description: '25-30% recurring revenue on MTN packages, 20% margin on BizFibre. Earn every month for the lifetime of each customer.',
    color: 'from-green-500 to-emerald-600',
  },
  {
    icon: BarChart3,
    title: 'Partner Portal',
    description: 'Track leads, commissions, and performance in real-time with our advanced partner dashboard. Full visibility into your pipeline.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: GraduationCap,
    title: 'Full Training',
    description: 'Product training, sales techniques, and portal onboarding. Plus ongoing webinars and resources to help you succeed.',
    color: 'from-purple-500 to-pink-600',
  },
  {
    icon: Megaphone,
    title: 'Marketing Support',
    description: 'Downloadable brochures, email templates, social graphics, and co-branded materials. Everything you need to promote.',
    color: 'from-orange-500 to-red-600',
  },
  {
    icon: UserCheck,
    title: 'Dedicated Manager',
    description: 'Personal account manager for your success. Get strategic support, monthly reviews, and priority technical assistance.',
    color: 'from-teal-500 to-cyan-600',
  },
  {
    icon: TrendingUp,
    title: 'Recurring Revenue',
    description: 'Build passive income with monthly commission payments. Create a sustainable business with predictable cash flow.',
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
            Why Partner with CircleTel?
          </h2>
          <p className="text-xl text-circleTel-secondaryNeutral max-w-3xl mx-auto">
            Join South Africa's innovative ISP and unlock powerful benefits designed for your success
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
