'use client';

import {
  PiArrowsClockwiseBold,
  PiCurrencyDollarBold,
  PiDotsThreeBold,
  PiMagnifyingGlassBold,
  PiUserCheckBold,
  PiUsersBold,
} from 'react-icons/pi';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  AdminPage,
  PageHeader,
  StatCard,
  SectionCard,
  StatusBadge,
  LoadingState,
  ErrorState,
  EmptyState,
  type StatusVariant,
} from '@/components/backend';

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

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

  return (
    <AdminPage>
      <PageHeader
        title="Customer Billing"
        subtitle="Manage customer billing and accounts"
        actions={
          <Button variant="outline" onClick={fetchCustomers}>
            <PiArrowsClockwiseBold className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Customers"
          value={stats?.totalCustomers || 0}
          icon={<PiUsersBold className="h-5 w-5" />}
        />
        <StatCard
          label="Active Customers"
          value={stats?.activeCustomers || 0}
          icon={<PiUserCheckBold className="h-5 w-5" />}
        />
        <StatCard
          label="Total Outstanding"
          value={formatCurrency(stats?.totalOutstanding || 0)}
          icon={<PiCurrencyDollarBold className="h-5 w-5" />}
        />
      </div>

      <SectionCard
        title="Customer List"
        action={
          <span className="text-sm text-gray-500">
            {filteredCustomers.length} of {customers.length}
          </span>
        }
      >
        <div className="mb-4">
          <div className="relative max-w-md">
            <PiMagnifyingGlassBold className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-circleTel-orange focus:border-transparent w-full"
            />
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <EmptyState
            icon={<PiUsersBold />}
            title={searchTerm ? 'No customers match your search' : 'No customers found'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outstanding
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Services
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        {customer.company && (
                          <div className="text-sm text-gray-500">{customer.company}</div>
                        )}
                        {customer.account_number && (
                          <div className="text-xs text-gray-400">{customer.account_number}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.email}</div>
                      {customer.phone && (
                        <div className="text-sm text-gray-500">{customer.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge
                        status={customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                        variant={CUSTOMER_STATUS_VARIANT[customer.status] ?? 'neutral'}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm font-medium tabular-nums ${
                          customer.outstanding_amount > 0 ? 'text-orange-600' : 'text-gray-500'
                        }`}
                      >
                        {formatCurrency(customer.outstanding_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.active_services}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(customer.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/admin/customers/${customer.id}`}>
                        <Button variant="ghost" size="icon">
                          <PiDotsThreeBold className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </AdminPage>
  );
}
