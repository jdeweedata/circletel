'use client';

import { Shield, Award, Zap, Clock, CheckCircle2 } from 'lucide-react';

const badges = [
  {
    icon: Shield,
    label: 'ICASA Licensed',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    icon: Award,
    label: 'B-BBEE Level 4',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    icon: CheckCircle2,
    label: 'POPIA Compliant',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    icon: Zap,
    label: 'MTN Partner',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  {
    icon: Clock,
    label: '24/7 Support',
    color: 'text-circleTel-orange',
    bgColor: 'bg-orange-100',
  },
];

export function TrustBadges() {
  return (
    <section className="py-6 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg ${badge.bgColor} flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${badge.color}`} />
                </div>
                <span>{badge.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
