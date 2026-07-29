'use client';

import {
  PiArrowLeftBold,
  PiArrowsClockwiseBold,
  PiBuildingsBold,
  PiCheckCircleBold,
  PiClockBold,
  PiCreditCardBold,
  PiDotsThreeBold,
  PiEyeBold,
  PiFunnelBold,
  PiMagnifyingGlassBold,
  PiShieldBold,
  PiUserBold,
  PiWarningCircleBold,
  PiXCircleBold,
} from 'react-icons/pi';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  AdminPage,
  PageHeader,
  StatCard,
  SectionCard,
  StatusBadge,
  LoadingState,
  EmptyState,
  type StatusVariant,
} from '@/components/backend';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  account_number: string | null;
}

interface PaymentMethod {
  id: string;
  customer_id: string;
  order_id: string | null;
  method_type: string;
  status: string;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number_masked: string | null;
  bank_account_type: string | null;
  branch_code: string | null;
  card_type: string | null;
  card_number_masked: string | null;
  card_holder_name: string | null;
  card_expiry_month: number | null;
  card_expiry_year: number | null;
  netcash_account_reference: string | null;
  netcash_mandate_reference: string | null;
  mandate_amount: number | null;
  mandate_frequency: string | null;
  mandate_debit_day: number | null;
  mandate_signed_at: string | null;
  mandate_active: boolean | null;
  is_primary: boolean | null;
  is_verified: boolean | null;
  verification_method: string | null;
  created_at: string;
  updated_at: string | null;
  activated_at: string | null;
  suspended_at: string | null;
  cancelled_at: string | null;
  customer: Customer | null;
}

interface Stats {
  total: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const PM_STATUS_VARIANT: Record<string, StatusVariant> = {
  active: 'success',
  pending: 'warning',
  suspended: 'warning',
  cancelled: 'error',
  expired: 'neutral',
};

const PM_STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  pending: 'Pending',
  suspended: 'Suspended',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

const METHOD_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  credit_card: { label: 'Credit Card', icon: <PiCreditCardBold className="w-4 h-4" /> },
  debit_card: { label: 'Debit Card', icon: <PiCreditCardBold className="w-4 h-4" /> },
  bank_account: { label: 'Bank Account', icon: <PiBuildingsBold className="w-4 h-4" /> },
  debit_order: { label: 'Debit Order', icon: <PiBuildingsBold className="w-4 h-4" /> },
};

export default function AdminPaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    method_type: '',
    search: '',
  });

  const fetchPaymentMethods = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());
      if (filters.status && filters.status !== 'all') params.set('status', filters.status);
      if (filters.method_type && filters.method_type !== 'all') {
        params.set('method_type', filters.method_type);
      }
      if (filters.search) params.set('search', filters.search);

      const response = await fetch(`/api/admin/billing/payment-methods?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch payment methods');
      }

      setPaymentMethods(data.data || []);
      setPagination(data.pagination || pagination);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      toast.error('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchPaymentMethods();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value === 'all' ? '' : value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ status: '', method_type: '', search: '' });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const getStatusBadge = (status: string) => (
    <StatusBadge
      status={PM_STATUS_LABEL[status] ?? status}
      variant={PM_STATUS_VARIANT[status] ?? 'neutral'}
    />
  );

  const getMethodDisplay = (pm: PaymentMethod) => {
    const config = METHOD_TYPE_CONFIG[pm.method_type] || {
      label: pm.method_type,
      icon: <PiCreditCardBold className="w-4 h-4" />,
    };

    if (pm.method_type === 'credit_card' || pm.method_type === 'debit_card') {
      return (
        <div className="flex items-center gap-2">
          {config.icon}
          <div>
            <p className="font-medium text-sm">
              {pm.card_type
                ? pm.card_type.charAt(0).toUpperCase() + pm.card_type.slice(1)
                : 'Card'}{' '}
              ****{pm.card_number_masked || '****'}
            </p>
            <p className="text-xs text-gray-500">
              {pm.card_holder_name || 'Unknown'}{' '}
              {pm.card_expiry_month && pm.card_expiry_year
                ? `| Exp: ${pm.card_expiry_month}/${pm.card_expiry_year}`
                : ''}
            </p>
          </div>
        </div>
      );
    }

    if (pm.method_type === 'bank_account' || pm.method_type === 'debit_order') {
      return (
        <div className="flex items-center gap-2">
          {config.icon}
          <div>
            <p className="font-medium text-sm">
              {pm.bank_name || 'Bank'} ****{pm.bank_account_number_masked || '****'}
            </p>
            <p className="text-xs text-gray-500">
              {pm.bank_account_name || 'Unknown'} | {pm.bank_account_type || 'Account'}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        {config.icon}
        <span className="font-medium text-sm">{config.label}</span>
      </div>
    );
  };

  const getCustomerDisplay = (pm: PaymentMethod) => {
    if (!pm.customer) {
      return <span className="text-gray-400 text-sm">Unknown</span>;
    }

    return (
      <div>
        <p className="font-medium text-sm">
          {pm.customer.first_name} {pm.customer.last_name}
        </p>
        <p className="text-xs text-gray-500">{pm.customer.email}</p>
        {pm.customer.account_number && (
          <p className="text-xs text-blue-600 font-mono">{pm.customer.account_number}</p>
        )}
      </div>
    );
  };

  return (
    <AdminPage>
      <PageHeader
        title="Payment Methods"
        subtitle="Manage customer payment methods and mandates"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/billing">
              <Button variant="ghost" size="sm">
                <PiArrowLeftBold className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <Button onClick={fetchPaymentMethods} variant="outline" disabled={loading}>
              <PiArrowsClockwiseBold className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Methods"
            value={stats.total}
            icon={<PiCreditCardBold className="h-5 w-5" />}
          />
          <StatCard
            label="Active"
            value={stats.by_status?.active || 0}
            icon={<PiCheckCircleBold className="h-5 w-5" />}
          />
          <StatCard
            label="Pending"
            value={stats.by_status?.pending || 0}
            icon={<PiClockBold className="h-5 w-5" />}
          />
          <StatCard
            label="Debit Orders"
            value={stats.by_type?.debit_order || stats.by_type?.bank_account || 0}
            icon={<PiBuildingsBold className="h-5 w-5" />}
          />
        </div>
      )}

      <SectionCard title="Filters">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <PiMagnifyingGlassBold className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, reference..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
          </div>
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.method_type || 'all'}
            onValueChange={(value) => handleFilterChange('method_type', value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="credit_card">Credit Card</SelectItem>
              <SelectItem value="debit_card">Debit Card</SelectItem>
              <SelectItem value="debit_order">Debit Order</SelectItem>
              <SelectItem value="bank_account">Bank Account</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSearch} variant="default">
            <PiFunnelBold className="w-4 h-4 mr-2" />
            Apply
          </Button>
          {(filters.status || filters.method_type || filters.search) && (
            <Button onClick={clearFilters} variant="ghost">
              Clear
            </Button>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Payment Methods">
        {loading ? (
          <LoadingState message="Loading payment methods..." />
        ) : paymentMethods.length === 0 ? (
          <EmptyState
            icon={<PiCreditCardBold />}
            title="No payment methods found"
            description="Try adjusting your filters"
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentMethods.map((pm) => (
                  <TableRow key={pm.id}>
                    <TableCell>{getCustomerDisplay(pm)}</TableCell>
                    <TableCell>{getMethodDisplay(pm)}</TableCell>
                    <TableCell>{getStatusBadge(pm.status)}</TableCell>
                    <TableCell>
                      {pm.is_verified ? (
                        <StatusBadge
                          status="Verified"
                          variant="success"
                          icon={<PiShieldBold className="w-3 h-3" />}
                        />
                      ) : (
                        <StatusBadge
                          status="Pending"
                          variant="neutral"
                          icon={<PiClockBold className="w-3 h-3" />}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {pm.netcash_account_reference || pm.netcash_mandate_reference || '-'}
                      </code>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{format(new Date(pm.created_at), 'dd MMM yyyy')}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(pm.created_at), 'HH:mm')}
                      </p>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <PiDotsThreeBold className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <PiEyeBold className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {pm.customer && (
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/customers/${pm.customer.id}`}>
                                <PiUserBold className="w-4 h-4 mr-2" />
                                View Customer
                              </Link>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </SectionCard>
    </AdminPage>
  );
}
