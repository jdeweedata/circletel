'use client';
import { PiBellBold, PiCheckCircleBold, PiQuestionBold, PiWarningBold, PiXCircleBold } from 'react-icons/pi';

import { Card, CardContent } from '@/components/ui/card';

interface HealthSummary {
  total: number;
  healthy: number;
  degraded: number;
  down: number;
  unknown: number;
  activeAlerts: number;
  suppressedAlerts: number;
}

interface HealthSummaryCardsProps {
  summary: HealthSummary;
}

export function HealthSummaryCards({ summary }: HealthSummaryCardsProps) {
  const cards = [
    {
      label: 'Total Integrations',
      value: summary.total,
      icon: PiCheckCircleBold,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Healthy',
      value: summary.healthy,
      icon: PiCheckCircleBold,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Degraded',
      value: summary.degraded,
      icon: PiWarningBold,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      label: 'Down',
      value: summary.down,
      icon: PiXCircleBold,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Unknown',
      value: summary.unknown,
      icon: PiQuestionBold,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    {
      label: 'Active Alerts',
      value: summary.activeAlerts,
      icon: PiBellBold,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
