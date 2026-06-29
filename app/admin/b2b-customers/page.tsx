'use client';
import { PiBuildingsBold, PiCheckCircleBold, PiClockBold, PiDotsThreeBold, PiMagnifyingGlassBold, PiWarningCircleBold } from 'react-icons/pi';

/**
 * Admin B2B Customers Page
 *
 * Displays all business customers with their journey status and management options.
 *
 * @module app/admin/b2b-customers/page
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { B2B_JOURNEY_STAGES, JourneyStageId } from '@/lib/business/journey-config';
import {
  DataTable,
  FilterToolbar,
  MetricPanel,
  PageHeader,
  SectionCard,
  StatusBadge,
  getStatusVariant,
  type DataTableColumn,
} from '@/components/backend';

// ============================================================================
// Types
// ============================================================================

interface BusinessCustomer {
  id: string;
  company_name: string;
  trading_name: string | null;
  registration_number: string | null;
  primary_contact_name: string;
  primary_contact_email: string;
  account_number: string;
  account_status: string;
  kyc_status: string;
  created_at: string;
  journey: {
    currentStage: JourneyStageId;
    currentStep: number;
    progressPercentage: number;
    blockedStage?: JourneyStageId;
    blockedReason?: string;
    stages: Array<{
      stageId: JourneyStageId;
      status: string;
    }>;
  } | null;
}

interface Stats {
  total: number;
  byStatus: Record<string, number>;
  byStage: Record<string, number>;
  blocked: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getStatusBadge(status: string) {
  const labels: Record<string, string> = {
    pending_verification: 'Pending Verification',
    verification_in_progress: 'Verifying',
    active: 'Active',
    suspended: 'Suspended',
    cancelled: 'Cancelled',
    dormant: 'Dormant',
  };
  const label = labels[status] || status.replace(/_/g, ' ');
  return <StatusBadge status={label} variant={getStatusVariant(label)} />;
}

function getStageName(stageId: JourneyStageId): string {
  const stage = B2B_JOURNEY_STAGES.find((s) => s.id === stageId);
  return stage?.shortTitle || stageId;
}

// ============================================================================
// Stats Cards Component
// ============================================================================

function StatsCards({ stats, loading }: { stats: Stats | null; loading: boolean }) {
  const cards = [
    {
      title: 'Total Customers',
      value: stats?.total ?? '...',
      icon: <PiBuildingsBold className="h-4 w-4" />,
      description: 'All business accounts',
    },
    {
      title: 'Active',
      value: stats?.byStatus.active ?? 0,
      icon: <PiCheckCircleBold className="h-4 w-4" />,
      description: 'Verified accounts',
    },
    {
      title: 'Pending Verification',
      value: stats?.byStatus.pending_verification ?? 0,
      icon: <PiClockBold className="h-4 w-4" />,
      description: 'Awaiting review',
    },
    {
      title: 'Blocked',
      value: stats?.blocked ?? 0,
      icon: <PiWarningCircleBold className="h-4 w-4" />,
      description: 'Needs intervention',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <MetricPanel
          key={card.title}
          label={card.title}
          value={card.value}
          description={loading && !stats ? 'Loading...' : card.description}
          icon={card.icon}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function AdminB2BCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<BusinessCustomer[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (stageFilter !== 'all') params.set('stage', stageFilter);

      const response = await fetch(`/api/admin/b2b-customers?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.data.customers);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, stageFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const columns: DataTableColumn<BusinessCustomer>[] = [
    {
      id: 'company',
      header: 'Company',
      cell: (customer) => (
        <div className="min-w-[220px]">
          <p className="font-medium text-gray-900">{customer.company_name}</p>
          <p className="text-xs text-gray-500">{customer.primary_contact_email}</p>
        </div>
      ),
    },
    {
      id: 'account',
      header: 'Account',
      cell: (customer) => (
        <code className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700">
          {customer.account_number}
        </code>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (customer) => getStatusBadge(customer.account_status),
    },
    {
      id: 'progress',
      header: 'Journey Progress',
      cell: (customer) =>
        customer.journey ? (
          <div className="flex min-w-[160px] items-center gap-2">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-circleTel-orange transition-all"
                style={{ width: `${customer.journey.progressPercentage}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-500">
              {customer.journey.progressPercentage}%
            </span>
            {customer.journey.blockedStage && (
              <PiWarningCircleBold className="h-4 w-4 text-red-500" aria-label="Blocked stage" />
            )}
          </div>
        ) : (
          <span className="text-sm text-gray-400">Not started</span>
        ),
    },
    {
      id: 'currentStage',
      header: 'Current Stage',
      cell: (customer) =>
        customer.journey ? (
          <StatusBadge
            status={getStageName(customer.journey.currentStage)}
            variant={customer.journey.blockedStage ? 'error' : 'neutral'}
          />
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
  ];

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setStageFilter('all');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="B2B Customers"
        subtitle="Manage business customers and track their onboarding journey"
        actions={
        <Button
          onClick={() => router.push('/admin/quotes?type=business')}
          className="bg-circleTel-orange hover:bg-orange-600"
        >
          View Business Quotes
        </Button>
        }
      />

      <StatsCards stats={stats} loading={loading} />

      <SectionCard title="Journey Stage Distribution" compact>
        <p className="mb-4 text-sm text-gray-500">
          Customers by current stage in the onboarding journey
        </p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {B2B_JOURNEY_STAGES.map((stage) => {
            const count = stats?.byStage[stage.id] || 0;
            const isActive = stageFilter === stage.id;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setStageFilter(stage.id)}
                className={`rounded-lg border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-circleTel-orange/25 ${
                  isActive
                    ? 'border-circleTel-orange bg-orange-50'
                    : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-white'
                }`}
              >
                <stage.icon className="mb-2 h-4 w-4 text-circleTel-orange" />
                <p className="text-xl font-semibold tabular-nums text-gray-950">{count}</p>
                <p className="text-xs text-gray-500">{stage.shortTitle}</p>
              </button>
            );
          })}
        </div>
      </SectionCard>

      <FilterToolbar
        action={
          (statusFilter !== 'all' || stageFilter !== 'all' || search) && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Clear Filters
            </Button>
          )
        }
      >
        <div className="relative min-w-0 flex-1">
          <PiMagnifyingGlassBold className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by company, email, or account number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending_verification">Pending Verification</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="h-10 w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {B2B_JOURNEY_STAGES.map((stage) => (
              <SelectItem key={stage.id} value={stage.id}>
                {stage.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterToolbar>

      <DataTable
        columns={columns}
        rows={customers}
        getRowId={(customer) => customer.id}
        loading={loading}
        loadingMessage="Loading business customers..."
        emptyIcon={<PiBuildingsBold />}
        emptyTitle="No business customers found"
        emptyDescription="Try adjusting your filters or search term."
        onRowClick={(customer) => router.push(`/admin/b2b-customers/${customer.id}`)}
        rowActions={(customer) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" aria-label={`Open actions for ${customer.company_name}`}>
                <PiDotsThreeBold className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`/admin/b2b-customers/${customer.id}`)}
              >
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/admin/b2b-customers/${customer.id}/journey`)}
              >
                Manage Journey
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/admin/b2b-customers/${customer.id}/documents`)}
              >
                View Documents
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />
    </div>
  );
}
