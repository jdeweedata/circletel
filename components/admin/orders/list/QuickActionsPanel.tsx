'use client';

import Link from 'next/link';
import {
  PiCreditCardBold,
  PiCalendarCheckBold,
  PiClockBold,
  PiWrenchBold,
  PiArrowRightBold,
  PiEyeBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/admin/shared/SectionCard';
import { StatusBadge, getStatusVariant } from '@/components/admin/shared/StatusBadge';

interface Order {
  id: string;
  order_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  package_name: string;
  package_price: number;
  total_paid: number;
  status: string;
  payment_status: string;
  installation_address: string;
  created_at: string;
  activation_date: string | null;
}

interface QuickActionsPanelProps {
  orders: Order[];
  onOpenStatusModal: (order: Order) => void;
}

interface ActionCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  statuses: string[];
  actionLabel: string;
  emptyMessage: string;
}

const ACTION_CATEGORIES: ActionCategory[] = [
  {
    id: 'needs_payment',
    title: 'Needs Payment Method',
    icon: PiCreditCardBold,
    statuses: ['pending', 'payment_method_pending'],
    actionLabel: 'Request Payment',
    emptyMessage: 'No orders awaiting payment setup',
  },
  {
    id: 'ready_to_schedule',
    title: 'Ready to Schedule',
    icon: PiCalendarCheckBold,
    statuses: ['payment_method_registered'],
    actionLabel: 'Schedule Install',
    emptyMessage: 'No orders ready for scheduling',
  },
  {
    id: 'scheduled',
    title: 'Installation Scheduled',
    icon: PiClockBold,
    statuses: ['installation_scheduled'],
    actionLabel: 'Start Install',
    emptyMessage: 'No scheduled installations',
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    icon: PiWrenchBold,
    statuses: ['installation_in_progress'],
    actionLabel: 'Complete Install',
    emptyMessage: 'No installations in progress',
  },
];

export function QuickActionsPanel({ orders, onOpenStatusModal }: QuickActionsPanelProps) {
  const getOrdersForCategory = (category: ActionCategory) => {
    return orders.filter((order) => category.statuses.includes(order.status)).slice(0, 5);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {ACTION_CATEGORIES.map((category) => {
        const categoryOrders = getOrdersForCategory(category);
        const Icon = category.icon;

        return (
          <SectionCard
            key={category.id}
            title={category.title}
            icon={Icon}
            action={
              categoryOrders.length > 0 ? (
                <span className="text-xs font-semibold text-circleTel-orange bg-circleTel-orange/10 px-2 py-1 rounded-full">
                  {categoryOrders.length}
                </span>
              ) : null
            }
          >
            {categoryOrders.length === 0 ? (
              <div className="text-center py-8">
                <Icon className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-500">{category.emptyMessage}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {categoryOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {order.order_number}
                        </span>
                        <StatusBadge
                          status={order.status.replace(/_/g, ' ')}
                          variant={getStatusVariant(order.status)}
                          showDot={false}
                          className="text-[10px] px-1.5 py-0.5"
                        />
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {order.first_name} {order.last_name} · {order.package_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <PiEyeBold className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onOpenStatusModal(order)}
                        className="h-7 text-xs gap-1"
                      >
                        {category.actionLabel}
                        <PiArrowRightBold className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        );
      })}
    </div>
  );
}
