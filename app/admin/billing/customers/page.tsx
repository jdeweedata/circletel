'use client';

import {
  PiArrowsClockwiseBold,
  PiCurrencyDollarBold,
  PiEyeBold,
  PiMagnifyingGlassBold,
  PiUserCheckBold,
  PiUsersBold,
} from 'react-icons/pi';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AdminPage,
  StatusBadge,
  LoadingState,
  ErrorState,
  EmptyState,
  type StatusVariant,
} from '@/components/backend';
import { HealthCard, formatRand, formatDueDate } from '@/components/admin/billing/health';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  account_number: string | null;
  status: string;
  account_type: string;
  created_at: string;
  updated_at: string;
  outstanding_amount: number;
  active_services: number;
}

interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  totalOutstanding: number;
}

const CUSTOMER_STATUS_VARIANT: Record<string, StatusVariant> = {
  active: 'success',
  inactive: 'neutral',
  suspended: 'error',
  pending: 'warning',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/billing/customers');
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }

      const data = await response.json();
      setCustomers(data.customers || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.account_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminPage>
        <LoadingState message="Loading customers..." />
      </AdminPage>
    );
  }

  if (error) {
    return (
      <AdminPage>
        <ErrorState title="Unable to load customers" message={error} onRetry={fetchCustomers} />
      </AdminPage>
    );
  }

  const inactiveCount = (stats?.totalCustomers ?? 0) - (stats?.activeCustomers ?? 0);

  return (
    <AdminPage>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="mb-1 text-xs text-slate-400">Finance / Billing / Customers</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Customer Billing</h1>
          <p className="mt-1 text-sm text-slate-500">Manage customer billing and accounts</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-slate-400">
            {filteredCustomers.length} of {customers.length} customers
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchCustomers}
            disabled={loading}
            aria-label="Refresh customers"
          >
            <PiArrowsClockwiseBold className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <HealthCard
          label="Total Customers"
          value={String(stats?.totalCustomers ?? 0)}
          primaryLine={`${stats?.activeCustomers ?? 0} active`}
          primaryClassName="text-teal-600"
          secondaryLine="All billing accounts"
          icon={<PiUsersBold className="h-5 w-5" />}
          iconClassName="bg-teal-50 text-teal-600"
        />
        <HealthCard
          label="Active Customers"
          value={String(stats?.activeCustomers ?? 0)}
          primaryLine={`${inactiveCount} inactive or suspended`}
          secondaryLine="Account status = active"
          icon={<PiUserCheckBold className="h-5 w-5" />}
          iconClassName="bg-teal-50 text-teal-600"
        />
        <HealthCard
          label="Total Outstanding"
          value={formatRand(stats?.totalOutstanding ?? 0)}
          primaryLine="Unpaid balances"
          primaryClassName="text-orange-500"
          secondaryLine="Across all customers"
          icon={<PiCurrencyDollarBold className="h-5 w-5" />}
          iconClassName="bg-orange-50 text-orange-500"
        />
      </div>

      <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Customer List</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {filteredCustomers.length} of {customers.length} customers
            </p>
          </div>
          <div className="relative w-full max-w-md">
            <PiMagnifyingGlassBold className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-circleTel-orange"
            />
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="px-6 py-12">
            <EmptyState
              icon={<PiUsersBold />}
              title={searchTerm ? 'No customers match your search' : 'No customers found'}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="pl-6 text-xs font-medium uppercase tracking-wide text-slate-400">Customer</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-400">Contact</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-400">Status</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-400">Outstanding</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-400">Services</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wide text-slate-400">Created</TableHead>
                  <TableHead className="pr-6 text-right text-xs font-medium uppercase tracking-wide text-slate-400">
                    <span className="sr-only">View</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="border-slate-100">
                    <TableCell className="pl-6">
                      <div className="text-sm font-medium text-slate-900">{customer.name}</div>
                      {customer.company && (
                        <div className="text-sm text-slate-500">{customer.company}</div>
                      )}
                      {customer.account_number && (
                        <div className="text-xs text-slate-400">{customer.account_number}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-900">{customer.email}</div>
                      {customer.phone && (
                        <div className="text-sm text-slate-500">{customer.phone}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                        variant={CUSTOMER_STATUS_VARIANT[customer.status] ?? 'neutral'}
                      />
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-sm font-semibold tabular-nums ${
                          customer.outstanding_amount > 0 ? 'text-red-600' : 'text-slate-400'
                        }`}
                      >
                        {formatRand(customer.outstanding_amount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {customer.active_services}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-slate-500">
                      {formatDueDate(customer.created_at)}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        aria-label={`View customer ${customer.name}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      >
                        <PiEyeBold className="h-4 w-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminPage>
  );
}
