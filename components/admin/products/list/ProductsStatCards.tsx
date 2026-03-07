'use client';

import {
  PiPackageBold,
  PiCheckCircleBold,
  PiPencilSimpleBold,
  PiArchiveBold,
  PiWarningBold,
} from 'react-icons/pi';
import { StatCard } from '@/components/admin/shared/StatCard';

export interface ProductStats {
  total: number;
  active: number;
  draft: number;
  archived: number;
  lowMargin: number;
}

export type StatFilterType = 'all' | 'active' | 'draft' | 'archived' | 'lowMargin' | null;

interface ProductsStatCardsProps {
  stats: ProductStats;
  activeFilter: StatFilterType;
  onFilterChange: (filter: StatFilterType) => void;
}

export function ProductsStatCards({
  stats,
  activeFilter,
  onFilterChange,
}: ProductsStatCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        label="Total Products"
        value={stats.total}
        icon={<PiPackageBold className="h-5 w-5" />}
        iconBgColor="bg-blue-100"
        iconColor="text-blue-600"
        onClick={() => onFilterChange(activeFilter === 'all' ? null : 'all')}
        isActive={activeFilter === 'all'}
        subtitle="All products"
      />
      <StatCard
        label="Active"
        value={stats.active}
        icon={<PiCheckCircleBold className="h-5 w-5" />}
        iconBgColor="bg-emerald-100"
        iconColor="text-emerald-600"
        onClick={() => onFilterChange(activeFilter === 'active' ? null : 'active')}
        isActive={activeFilter === 'active'}
        subtitle="Live in catalogue"
      />
      <StatCard
        label="Draft"
        value={stats.draft}
        icon={<PiPencilSimpleBold className="h-5 w-5" />}
        iconBgColor="bg-amber-100"
        iconColor="text-amber-600"
        onClick={() => onFilterChange(activeFilter === 'draft' ? null : 'draft')}
        isActive={activeFilter === 'draft'}
        subtitle="In progress"
      />
      <StatCard
        label="Archived"
        value={stats.archived}
        icon={<PiArchiveBold className="h-5 w-5" />}
        iconBgColor="bg-slate-100"
        iconColor="text-slate-600"
        onClick={() => onFilterChange(activeFilter === 'archived' ? null : 'archived')}
        isActive={activeFilter === 'archived'}
        subtitle="Discontinued"
      />
      <StatCard
        label="Low Margin"
        value={stats.lowMargin}
        icon={<PiWarningBold className="h-5 w-5" />}
        iconBgColor="bg-red-100"
        iconColor="text-red-600"
        onClick={() => onFilterChange(activeFilter === 'lowMargin' ? null : 'lowMargin')}
        isActive={activeFilter === 'lowMargin'}
        subtitle="Below 25% margin"
      />
    </div>
  );
}
