'use client';

import {
  PiArrowsClockwiseBold,
  PiCheckCircleBold,
  PiDownloadSimpleBold,
  PiEnvelopeBold,
  PiFunnelBold,
  PiMapPinBold,
  PiPhoneBold,
  PiTrendUpBold,
  PiUserPlusBold,
  PiWarningBold,
} from 'react-icons/pi';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDistanceToNow } from 'date-fns';

interface NoCoverageLead {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  serviceType: string | null;
  expectedUsage: string | null;
  budgetRange: string | null;
  urgency: string | null;
  notes: string | null;
  marketingConsent: boolean;
  source: string | null;
  status: string;
  contactedAt: string | null;
  convertedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  new: number;
  newThisWeek: number;
  contacted: number;
  qualified: number;
  converted: number;
  conversionRate: number;
  serviceTypes: { name: string; count: number }[];
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  qualified: 'bg-purple-100 text-purple-800',
  converted: 'bg-green-100 text-green-800',
  declined: 'bg-gray-100 text-gray-600',
};

const URGENCY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
};

export default function NoCoverageLeadsPage() {
  const [leads, setLeads] = useState<NoCoverageLead[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    new: 0,
    newThisWeek: 0,
    contacted: 0,
    qualified: 0,
    converted: 0,
    conversionRate: 0,
    serviceTypes: [],
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);

  // Filter state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [urgency, setUrgency] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        sortBy,
        sortOrder,
      });

      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (serviceType) params.set('service_type', serviceType);
      if (urgency) params.set('urgency', urgency);

      const response = await fetch(
        `/api/admin/marketing/no-coverage-leads?${params}`
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch leads');
      }

      setLeads(data.data.leads);
      setStats(data.data.stats);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.pageSize,
    search,
    status,
    serviceType,
    urgency,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleServiceTypeChange = (value: string) => {
    setServiceType(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleUrgencyChange = (value: string) => {
    setUrgency(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === leads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map((l) => l.id));
    }
  };

  const bulkUpdateStatus = async (newStatus: string) => {
    if (selectedIds.length === 0) return;

    try {
      setUpdating(true);
      const response = await fetch('/api/admin/marketing/no-coverage-leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, status: newStatus }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update leads');
      }

      setSelectedIds([]);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const exportToCSV = async () => {
    try {
      const params = new URLSearchParams({
        page: '1',
        pageSize: '5000',
        sortBy,
        sortOrder,
      });
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (serviceType) params.set('service_type', serviceType);
      if (urgency) params.set('urgency', urgency);

      const response = await fetch(
        `/api/admin/marketing/no-coverage-leads?${params}`
      );
      const data = await response.json();

      if (!data.success) throw new Error('Failed to export');

      const csvRows = [
        [
          'Name',
          'Email',
          'Phone',
          'Address',
          'Service Type',
          'Budget Range',
          'Urgency',
          'Status',
          'Marketing Consent',
          'Notes',
          'Created',
        ].join(','),
        ...data.data.leads.map((l: NoCoverageLead) =>
          [
            `"${(l.fullName || '').replace(/"/g, '""')}"`,
            l.email || '',
            l.phone || '',
            `"${(l.address || '').replace(/"/g, '""')}"`,
            l.serviceType || '',
            l.budgetRange || '',
            l.urgency || '',
            l.status || '',
            l.marketingConsent ? 'Yes' : 'No',
            `"${(l.notes || '').replace(/"/g, '""')}"`,
            l.createdAt || '',
          ].join(',')
        ),
      ];

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `no-coverage-leads-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <PiMapPinBold className="h-8 w-8 text-orange-600" />
              No Coverage Leads
            </h1>
            <p className="text-gray-600 mt-1">
              Demand signals from users searching for service in uncovered areas
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={fetchData} disabled={loading} variant="outline">
              <PiArrowsClockwiseBold
                className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
            <Button onClick={exportToCSV} variant="outline">
              <PiDownloadSimpleBold className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <PiWarningBold className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Leads</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.total.toLocaleString()}
                  </p>
                </div>
                <PiUserPlusBold className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">New This Week</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {stats.newThisWeek.toLocaleString()}
                  </p>
                </div>
                <PiFunnelBold className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Contacted</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {stats.contacted.toLocaleString()}
                  </p>
                </div>
                <PiEnvelopeBold className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Conversion Rate</p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.conversionRate}%
                  </p>
                </div>
                <PiTrendUpBold className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">
                  {selectedIds.length} lead{selectedIds.length > 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => bulkUpdateStatus('contacted')}
                    disabled={updating}
                  >
                    Mark Contacted
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => bulkUpdateStatus('qualified')}
                    disabled={updating}
                  >
                    Mark Qualified
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => bulkUpdateStatus('converted')}
                    disabled={updating}
                  >
                    <PiCheckCircleBold className="h-4 w-4 mr-1" />
                    Mark Converted
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => bulkUpdateStatus('declined')}
                    disabled={updating}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PiMapPinBold className="h-5 w-5" />
              Lead Directory
            </CardTitle>
            <CardDescription>
              {pagination.total.toLocaleString()} leads from coverage check requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
              <input
                type="text"
                placeholder="Search name, email, or address..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="converted">Converted</option>
                <option value="declined">Declined</option>
              </select>
              <select
                value={serviceType}
                onChange={(e) => handleServiceTypeChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Services</option>
                <option value="fibre">Fibre</option>
                <option value="lte">LTE</option>
                <option value="5g">5G</option>
                <option value="wireless">Wireless</option>
                <option value="any">Any</option>
              </select>
              <select
                value={urgency}
                onChange={(e) => handleUrgencyChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Urgency</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-2 text-left">
                      <input
                        type="checkbox"
                        checked={
                          leads.length > 0 &&
                          selectedIds.length === leads.length
                        }
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th
                      className="py-3 px-2 text-left font-medium text-gray-500 cursor-pointer hover:text-gray-900"
                      onClick={() => handleSortChange('full_name')}
                    >
                      Name {sortBy === 'full_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-3 px-2 text-left font-medium text-gray-500">
                      Contact
                    </th>
                    <th
                      className="py-3 px-2 text-left font-medium text-gray-500 cursor-pointer hover:text-gray-900"
                      onClick={() => handleSortChange('address')}
                    >
                      Address {sortBy === 'address' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-3 px-2 text-left font-medium text-gray-500">
                      Service
                    </th>
                    <th className="py-3 px-2 text-left font-medium text-gray-500">
                      Budget
                    </th>
                    <th className="py-3 px-2 text-left font-medium text-gray-500">
                      Urgency
                    </th>
                    <th className="py-3 px-2 text-left font-medium text-gray-500">
                      Status
                    </th>
                    <th
                      className="py-3 px-2 text-left font-medium text-gray-500 cursor-pointer hover:text-gray-900"
                      onClick={() => handleSortChange('created_at')}
                    >
                      Created{' '}
                      {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading && leads.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-500">
                        Loading leads...
                      </td>
                    </tr>
                  ) : leads.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-500">
                        No leads found matching your filters
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => (
                      <tr
                        key={lead.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 ${
                          selectedIds.includes(lead.id) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="py-3 px-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(lead.id)}
                            onChange={() => toggleSelect(lead.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="py-3 px-2 font-medium text-gray-900">
                          {lead.fullName}
                        </td>
                        <td className="py-3 px-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-gray-600">
                              <PiEnvelopeBold className="h-3 w-3" />
                              <span className="text-xs">{lead.email}</span>
                            </div>
                            {lead.phone && (
                              <div className="flex items-center gap-1 text-gray-600">
                                <PiPhoneBold className="h-3 w-3" />
                                <span className="text-xs">{lead.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-gray-600 max-w-[200px] truncate">
                          {lead.address}
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-xs capitalize">
                            {lead.serviceType || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-xs">
                            {lead.budgetRange
                              ? lead.budgetRange.replace(/_/g, ' ')
                              : '-'}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          {lead.urgency && (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                URGENCY_COLORS[lead.urgency] || ''
                              }`}
                            >
                              {lead.urgency}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              STATUS_COLORS[lead.status] || ''
                            }`}
                          >
                            {lead.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-gray-500 text-xs">
                          {formatDistanceToNow(new Date(lead.createdAt))} ago
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
                  {Math.min(
                    pagination.page * pagination.pageSize,
                    pagination.total
                  )}{' '}
                  of {pagination.total.toLocaleString()} leads
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-3 text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Type Breakdown */}
        {stats.serviceTypes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Service Interest Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 text-sm">
                {stats.serviceTypes.map((st) => (
                  <div key={st.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-orange-500" />
                    <span className="capitalize">{st.name}</span>
                    <span className="text-gray-500">({st.count})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
