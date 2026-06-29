'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  PiBuildingBold,
  PiCalendarBold,
  PiCheckCircleBold,
  PiEnvelopeBold,
  PiMagnifyingGlassBold,
  PiPhoneBold,
  PiUserBold,
  PiUserPlusBold,
  PiUsersBold,
} from 'react-icons/pi';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DataTable,
  ErrorState,
  FilterToolbar,
  PageHeader,
  StatCard,
  StatusBadge,
  getStatusVariant,
  type DataTableColumn,
} from '@/components/backend';

interface Customer {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  account_type: 'personal' | 'business' | string | null;
  business_name?: string | null;
  status: string | null;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatLabel(value: string) {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function customerDisplayName(customer: Customer) {
  const name = `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim();
  return name || customer.email || 'Unnamed customer';
}

function accountTypeLabel(type: Customer['account_type']) {
  if (type === 'business') return 'Business';
  if (type === 'personal') return 'Personal';
  return 'Unknown';
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [accountTypeFilter, setAccountTypeFilter] = React.useState<'all' | 'personal' | 'business'>('all');
  const [statusFilter, setStatusFilter] = React.useState('all');

  const fetchCustomers = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/customers');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch customers');
      }

      setCustomers(result.data || []);
    } catch (fetchError) {
      console.error('Error fetching customers:', fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const statuses = React.useMemo(
    () =>
      Array.from(
        new Set(customers.map((customer) => customer.status).filter((status): status is string => Boolean(status)))
      ).sort(),
    [customers]
  );

  const filteredCustomers = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesQuery =
        !query ||
        (customer.first_name ?? '').toLowerCase().includes(query) ||
        (customer.last_name ?? '').toLowerCase().includes(query) ||
        (customer.email ?? '').toLowerCase().includes(query) ||
        (customer.phone ?? '').includes(query) ||
        (customer.business_name ?? '').toLowerCase().includes(query);

      return (
        matchesQuery &&
        (accountTypeFilter === 'all' || customer.account_type === accountTypeFilter) &&
        (statusFilter === 'all' || customer.status === statusFilter)
      );
    });
  }, [accountTypeFilter, customers, searchQuery, statusFilter]);

  const stats = React.useMemo(
    () => ({
      total: customers.length,
      personal: customers.filter((customer) => customer.account_type === 'personal').length,
      business: customers.filter((customer) => customer.account_type === 'business').length,
      active: customers.filter((customer) => customer.status === 'active').length,
    }),
    [customers]
  );

  const hasActiveFilters =
    searchQuery.trim().length > 0 || accountTypeFilter !== 'all' || statusFilter !== 'all';

  const columns = React.useMemo<DataTableColumn<Customer>[]>(
    () => [
      {
        id: 'customer',
        header: 'Customer',
        className: 'min-w-[260px] whitespace-normal',
        cell: (customer) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-circleTel-orange-light">
              <PiUserBold className="h-4 w-4 text-circleTel-orange-accessible" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900">
                {customerDisplayName(customer)}
              </p>
              {customer.business_name && (
                <p className="truncate text-xs text-gray-500">{customer.business_name}</p>
              )}
            </div>
          </div>
        ),
      },
      {
        id: 'contact',
        header: 'Contact',
        className: 'min-w-[280px] whitespace-normal',
        cell: (customer) => (
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
              <PiEnvelopeBold className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="break-all">{customer.email || 'No email address'}</span>
              {customer.email_verified && (
                <StatusBadge status="Verified" variant="success" className="px-1.5 py-0 text-[10px]" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <PiPhoneBold className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span>{customer.phone || 'No phone number'}</span>
            </div>
          </div>
        ),
      },
      {
        id: 'accountType',
        header: 'Account type',
        cell: (customer) => (
          <StatusBadge
            status={accountTypeLabel(customer.account_type)}
            variant={customer.account_type === 'business' ? 'info' : 'neutral'}
            icon={
              customer.account_type === 'business' ? (
                <PiBuildingBold className="h-3 w-3" />
              ) : (
                <PiUserBold className="h-3 w-3" />
              )
            }
          />
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: (customer) => (
          <StatusBadge
            status={formatLabel(customer.status || 'unknown')}
            variant={customer.status ? getStatusVariant(customer.status) : 'neutral'}
          />
        ),
      },
      {
        id: 'created',
        header: 'Created',
        className: 'text-gray-600',
        cell: (customer) => (
          <div className="flex items-center gap-2 text-xs tabular-nums text-gray-600">
            <PiCalendarBold className="h-3.5 w-3.5 text-gray-400" />
            {formatDate(customer.created_at)}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Management"
        subtitle="View and manage customer accounts"
        actions={
          <Button>
            <PiUserPlusBold className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Customers"
          value={stats.total}
          subtitle={`${filteredCustomers.length} shown`}
          icon={<PiUsersBold className="h-5 w-5" />}
        />
        <StatCard
          title="Personal Accounts"
          value={stats.personal}
          subtitle="Residential customers"
          icon={<PiUserBold className="h-5 w-5" />}
        />
        <StatCard
          title="Business Accounts"
          value={stats.business}
          subtitle="Company and clinic accounts"
          icon={<PiBuildingBold className="h-5 w-5" />}
        />
        <StatCard
          title="Active Customers"
          value={stats.active}
          subtitle={`${Math.max(stats.total - stats.active, 0)} not active`}
          icon={<PiCheckCircleBold className="h-5 w-5" />}
        />
      </div>

      <FilterToolbar
        action={
          hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setAccountTypeFilter('all');
                setStatusFilter('all');
              }}
            >
              Clear filters
            </Button>
          ) : null
        }
      >
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">Search customers</span>
          <PiMagnifyingGlassBold className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-9 pl-9"
          />
        </label>

        <select
          value={accountTypeFilter}
          onChange={(event) => setAccountTypeFilter(event.target.value as 'all' | 'personal' | 'business')}
          className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-circleTel-orange focus:ring-2 focus:ring-circleTel-orange/15 sm:w-auto"
          aria-label="Filter by account type"
        >
          <option value="all">All account types</option>
          <option value="personal">Personal</option>
          <option value="business">Business</option>
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-circleTel-orange focus:ring-2 focus:ring-circleTel-orange/15 sm:w-auto"
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {formatLabel(status)}
            </option>
          ))}
        </select>
      </FilterToolbar>

      {error ? (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <ErrorState
            title="Could not load customers"
            message={error}
            onRetry={fetchCustomers}
            className="min-h-[320px]"
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={filteredCustomers}
          getRowId={(customer) => customer.id}
          loading={loading}
          loadingMessage="Loading customers..."
          emptyIcon={<PiUsersBold />}
          emptyTitle={hasActiveFilters ? 'No customers match your filters' : 'No customers yet'}
          emptyDescription={
            hasActiveFilters
              ? 'Try a different search term, account type, or status.'
              : 'Customer accounts will appear here once they are created.'
          }
          rowActions={(customer) => (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={() => router.push(`/admin/customers/${customer.id}`)}
            >
              View details
            </Button>
          )}
        />
      )}
    </div>
  );
}
