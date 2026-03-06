'use client';

import React from 'react';
import { PiLightningBold, PiCheckCircleBold } from 'react-icons/pi';
import { FaWhatsapp } from 'react-icons/fa';
import { cn } from '@/lib/utils';

export interface StatItem {
  icon: React.ReactNode;
  value: string;
  label: string;
}

interface StatCalloutsProps {
  stats?: StatItem[];
  className?: string;
}

const DEFAULT_STATS: StatItem[] = [
  {
    icon: <PiLightningBold className="w-6 h-6 text-circleTel-orange" />,
    value: '3-7 days',
    label: 'Installation',
  },
  {
    icon: <FaWhatsapp className="w-6 h-6 text-green-600" />,
    value: 'WhatsApp Support',
    label: '+ AI assistance',
  },
  {
    icon: <PiCheckCircleBold className="w-6 h-6 text-circleTel-blue-600" />,
    value: 'No contracts',
    label: 'Cancel anytime',
  },
];

export function StatCallouts({ stats = DEFAULT_STATS, className }: StatCalloutsProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-4', className)}>
      {stats.map((stat, index) => (
        <div
          key={index}
          className="stat-callout flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex-shrink-0">{stat.icon}</div>
          <div>
            <p className="font-semibold text-circleTel-navy">{stat.value}</p>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
