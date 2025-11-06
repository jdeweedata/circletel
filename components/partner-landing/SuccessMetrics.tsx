'use client';

import { Users, DollarSign, TrendingUp, Award } from 'lucide-react';

const metrics = [
  {
    icon: Users,
    value: '200+',
    label: 'Active Partners',
    description: 'Across South Africa',
  },
  {
    icon: DollarSign,
    value: 'R2.5M+',
    label: 'Paid in 2024',
    description: 'Total commissions',
  },
  {
    icon: TrendingUp,
    value: 'R18,500',
    label: 'Average Monthly',
    description: 'Per active partner',
  },
  {
    icon: Award,
    value: '98%',
    label: 'Satisfaction',
    description: 'Partner rating',
  },
];

export function SuccessMetrics() {
  return (
    <section className="py-16 bg-gradient-to-br from-circleTel-darkNeutral to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-circleTel-orange/20 mb-4 group-hover:bg-circleTel-orange/30 transition-colors duration-300">
                  <Icon className="h-7 w-7 text-circleTel-orange" />
                </div>
                <div className="text-3xl lg:text-4xl font-extrabold mb-2 text-circleTel-orange">
                  {metric.value}
                </div>
                <div className="text-lg font-semibold mb-1">{metric.label}</div>
                <div className="text-sm text-gray-400">{metric.description}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
