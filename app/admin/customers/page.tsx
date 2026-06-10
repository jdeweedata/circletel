'use client';
import {
  PiBuildingBold,
  PiCaretLeftBold,
  PiCaretRightBold,
  PiEnvelopeBold,
  PiMagnifyingGlassBold,
  PiPhoneBold,
  PiUserBold,
} from 'react-icons/pi';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  account_number: string | null;
  account_type: 'personal' | 'business';
  business_name?: string | null;
  status: string;
  email_verified: boolean;
  created_at: string;
  outstanding_balance: number;
  has_overdue: boolean;
}

interface Stats {
  total: number;
  overdue: number;
  suspended: number;
  new_this_week: number;
}

type FilterValue = '' | 'overdue' | 'suspended' | 'new';

const PAGE_SIZE = 25;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

function CustomersPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [searchInput, setSearchInput] = React.useState(searchParams.get('q') || '');
  const [query, setQuery] = React.useState(searchParams.get('q') || '');
  const [filter, setFilter] = React.useState<FilterValue>(
    (searchParams.get('filter') as FilterValue) || ''
  );
  const [page, setPage] = React.useState(0);
  const [retryToken, setRetryToken] = React.useState(0);

  // Debounce search input -> query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(searchInput.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Keep URL in sync so searches survive back-navigation and can be shared
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filter) params.set('filter', filter);
    const qs = params.toString();
    window.history.replaceState({}, '', qs ? `?${qs}` : window.location.pathname);
  }, [query, filter]);

  React.useEffect(() => {
    const controller = new AbortController();
    const fetchCustomers = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(page * PAGE_SIZE),
        });
        if (query) params.set('q', query);
        if (filter) params.set('filter', filter);

        const response = await fetch(`/api/admin/customers?${params.toString()}`, {
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to fetch customers');
        }
        setCustomers(result.data || []);
        setTotalCount(result.count || 0);
        if (result.stats) setStats(result.stats);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('Error fetching customers:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch customers');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchCustomers();
    return () => controller.abort();
  }, [query, filter, page, retryToken]);

  const toggleFilter = (value: FilterValue) => {
    setFilter((current) => (current === value ? '' : value));
    setPage(0);
  };

  const statCards: Array<{
    label: string;
    value: number;
    filter: FilterValue;
    accent?: string;
  }> = [
    { label: 'All Customers', value: stats?.total ?? 0, filter: '' },
    { label: 'Overdue Balance', value: stats?.overdue ?? 0, filter: 'overdue', accent: 'text-red-600' },
    { label: 'Suspended', value: stats?.suspended ?? 0, filter: 'suspended', accent: 'text-yellow-600' },
    { label: 'New This Week', value: stats?.new_this_week ?? 0, filter: 'new', accent: 'text-green-600' },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      inactive: 'secondary',
      suspended: 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const pageStart = page * PAGE_SIZE + 1;
  const pageEnd = Math.min((page + 1) * PAGE_SIZE, totalCount);
  const hasNextPage = (page + 1) * PAGE_SIZE < totalCount;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
        <p className="text-gray-600 mt-1">
          Find a customer to check their balance, take a payment, or open a ticket
        </p>
      </div>

      {/* Clickable stat filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => {
          const isActive = filter === card.filter && (card.filter !== '' || filter === '');
          return (
            <Card
              key={card.label}
              role="button"
              tabIndex={0}
              onClick={() => toggleFilter(card.filter)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') toggleFilter(card.filter);
              }}
              className={`cursor-pointer transition-colors hover:border-circleTel-orange ${
                isActive ? 'border-circleTel-orange ring-1 ring-circleTel-orange' : ''
              }`}
            >
              <CardHeader className="pb-2">
                <CardDescription>{card.label}</CardDescription>
                <CardTitle className={`text-3xl ${card.accent || ''}`}>
                  {stats ? card.value : '–'}
                </CardTitle>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Customers</CardTitle>
              <CardDescription>
                {loading
                  ? 'Searching…'
                  : totalCount === 0
                  ? 'No customers found'
                  : `Showing ${pageStart}–${pageEnd} of ${totalCount}`}
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-80">
              <PiMagnifyingGlassBold className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search name, email, phone or account number…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-3">{error}</p>
              <Button variant="outline" onClick={() => setRetryToken((t) => t + 1)}>
                Try Again
              </Button>
            </div>
          ) : loading ? (
            <div className="space-y-3 py-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">
                {query || filter
                  ? 'No customers match your search or filter'
                  : 'No customers yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/admin/customers/${customer.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-circleTel-orange/10 flex items-center justify-center flex-shrink-0">
                            {customer.account_type === 'business' ? (
                              <PiBuildingBold className="h-5 w-5 text-circleTel-orange" />
                            ) : (
                              <PiUserBold className="h-5 w-5 text-circleTel-orange" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {customer.first_name} {customer.last_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {customer.business_name || customer.account_number || ''}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <PiEnvelopeBold className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-600">{customer.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <PiPhoneBold className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-600">{customer.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {customer.outstanding_balance > 0 ? (
                          <span
                            className={`font-semibold ${
                              customer.has_overdue ? 'text-red-600' : 'text-gray-900'
                            }`}
                          >
                            {formatCurrency(customer.outstanding_balance)}
                            {customer.has_overdue && (
                              <span className="block text-xs font-normal text-red-500">
                                overdue
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.account_type === 'business' ? 'secondary' : 'outline'}>
                          {customer.account_type === 'business' ? 'Business' : 'Personal'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(customer.status)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{formatDate(customer.created_at)}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Showing {pageStart}–{pageEnd} of {totalCount}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(p - 1, 0))}
                  >
                    <PiCaretLeftBold className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasNextPage}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                    <PiCaretRightBold className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-8 px-4 text-gray-500">Loading…</div>}>
      <CustomersPageInner />
    </Suspense>
  );
}
