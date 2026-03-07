'use client';

import { PiShoppingCartBold, PiClockBold, PiCheckCircleBold, PiCurrencyCircleDollarBold } from 'react-icons/pi';
import { StatCard } from '@/components/admin/shared/StatCard';

interface OrderStats {
  total: number;
  pending: number;
  active: number;
  cancelled: number;
  totalRevenue: number;
}

interface OrdersListStatCardsProps {
  stats: OrderStats;
  activeFilter: 'all' | 'pending' | 'active' | null;
  onFilterChange: (filter: 'all' | 'pending' | 'active') => void;
}

export function OrdersListStatCards({
  stats,
  activeFilter,
  onFilterChange,
}: OrdersListStatCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Orders"
        value={stats.total}
        icon={<PiShoppingCartBold className="h-5 w-5" />}
        iconBgColor="bg-blue-100"
        iconColor="text-blue-600"
        onClick={() => onFilterChange('all')}
        isActive={activeFilter === 'all'}
        subtitle="All time orders"
      />
      <StatCard
        label="Pending"
        value={stats.pending}
        icon={<PiClockBold className="h-5 w-5" />}
        iconBgColor="bg-amber-100"
        iconColor="text-amber-600"
        onClick={() => onFilterChange('pending')}
        isActive={activeFilter === 'pending'}
        subtitle="Awaiting action"
      />
      <StatCard
        label="Active"
        value={stats.active}
        icon={<PiCheckCircleBold className="h-5 w-5" />}
        iconBgColor="bg-emerald-100"
        iconColor="text-emerald-600"
        onClick={() => onFilterChange('active')}
        isActive={activeFilter === 'active'}
        subtitle="Live subscriptions"
      />
      <StatCard
        label="Revenue"
        value={`R${stats.totalRevenue.toLocaleString()}`}
        icon={<PiCurrencyCircleDollarBold className="h-5 w-5" />}
        iconBgColor="bg-purple-100"
        iconColor="text-purple-600"
        subtitle="Monthly recurring"
      />
    </div>
  );
}
