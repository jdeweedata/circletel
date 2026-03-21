'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PiArrowSquareOutBold,
  PiBriefcaseBold,
  PiBuildingsBold,
  PiCaretLeftBold,
  PiCaretRightBold,
  PiCheckCircleBold,
  PiClockBold,
  PiEnvelopeBold,
  PiFunnelBold,
  PiGridFourBold,
  PiListBold,
  PiMagnifyingGlassBold,
  PiMapPinBold,
  PiPhoneBold,
  PiPlusBold,
  PiUsersBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { StatCard } from '@/components/admin/shared/StatCard';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface CorporateAccount {
  id: string;
  corporateCode: string;
  companyName: string;
  tradingName?: string | null;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone?: string | null;
  accountStatus: 'active' | 'suspended' | 'pending' | 'archived';
  totalSites: number;
  activeSites: number;
  pendingSites: number;
  industry?: string | null;
  createdAt: string;
}

interface CorporateStats {
  totalCorporates: number;
  activeCorporates: number;
  totalSites: number;
  activeSites: number;
  pendingSites: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// =============================================================================
// Constants
// =============================================================================

const STATUS_CONFIG: Record<string, { color: string; dot: string }> = {
  active: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  pending: { color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  suspended: { color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
  archived: { color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
};

// =============================================================================
// CorporateCard (Grid View)
// =============================================================================

function CorporateCard({
  corporate,
  onClick,
}: {
  corporate: CorporateAccount;
  onClick: () => void;
}) {
  const status = STATUS_CONFIG[corporate.accountStatus] ?? STATUS_CONFIG.archived;
  const siteProgress = corporate.totalSites > 0 ? (corporate.activeSites / corporate.totalSites) * 100 : 0;

  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-slate-300 transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
            <span className="text-xs font-bold font-mono text-orange-600">{corporate.corporateCode}</span>
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
              {corporate.companyName}
            </h3>
            {corporate.tradingName && (
              <p className="text-xs text-slate-400 truncate">t/a {corporate.tradingName}</p>
            )}
          </div>
        </div>
        <Badge variant="outline" className={cn('text-xs border', status.color)}>
          <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', status.dot)} />
          {corporate.accountStatus}
        </Badge>
      </div>

      {/* Sites Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="text-slate-500">Sites</span>
          <span className="font-semibold text-slate-900">
            <span className="text-emerald-600">{corporate.activeSites}</span>
            <span className="text-slate-300 mx-1">/</span>
            {corporate.totalSites}
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${siteProgress}%` }}
          />
        </div>
        {corporate.pendingSites > 0 && (
          <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
            <PiClockBold className="w-3 h-3" />
            {corporate.pendingSites} pending deployment
          </p>
        )}
      </div>

      {/* Contact */}
      <div className="pt-3 border-t border-slate-100">
        <p className="text-sm font-medium text-slate-700 truncate">{corporate.primaryContactName}</p>
        <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
          <PiEnvelopeBold className="w-3 h-3" />
          {corporate.primaryContactEmail}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
        {corporate.industry ? (
          <span className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
            {corporate.industry}
          </span>
        ) : (
          <span />
        )}
        <span className="text-xs text-slate-400">
          {new Date(corporate.createdAt).toLocaleDateString('en-ZA', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </span>
      </div>
    </button>
  );
}

// =============================================================================
// Page Component
// =============================================================================

export default function CorporateListPage() {
  const router = useRouter();

  const [corporates, setCorporates] = useState<CorporateAccount[]>([]);
  const [stats, setStats] = useState<CorporateStats>({
    totalCorporates: 0, activeCorporates: 0, totalSites: 0, activeSites: 0, pendingSites: 0,
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1, limit: 12, total: 0, totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    fetchCorporates();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, statusFilter]);

  const fetchCorporates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery) params.set('search', searchQuery);

      const response = await fetch(`/api/admin/corporate?${params}`);
      if (!response.ok) throw new Error('Failed to fetch corporates');

      const data = await response.json();
      setCorporates(data.data || []);
      setPagination({
        page: data.page, limit: data.limit, total: data.total, totalPages: data.totalPages,
      });
    } catch (error) {
      console.error('Error fetching corporates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/corporate/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchCorporates();
  };

  return (
    <div className="min-h-screen bg-slate-50 -m-6 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <Link href="/admin" className="hover:text-slate-700">Admin</Link>
          <PiCaretRightBold className="w-3 h-3" />
          <span className="text-slate-900">Corporate Clients</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Corporate Clients</h1>
            <p className="text-slate-500 mt-1">Manage enterprise multi-site accounts</p>
          </div>
          <Button onClick={() => router.push('/admin/corporate/new')}>
            <PiPlusBold className="w-4 h-4 mr-2" />
            Add Corporate
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          label="Total Corporates"
          value={String(stats.totalCorporates)}
          icon={<PiBriefcaseBold className="w-5 h-5" />}
          iconBgColor="bg-orange-100"
          iconColor="text-orange-600"
        />
        <StatCard
          label="Active Corporates"
          value={String(stats.activeCorporates)}
          icon={<PiCheckCircleBold className="w-5 h-5" />}
          iconBgColor="bg-emerald-100"
          iconColor="text-emerald-600"
          subtitle={stats.totalCorporates > 0 ? `${Math.round((stats.activeCorporates / stats.totalCorporates) * 100)}% of total` : undefined}
        />
        <StatCard
          label="Total Sites"
          value={String(stats.totalSites)}
          icon={<PiMapPinBold className="w-5 h-5" />}
          iconBgColor="bg-violet-100"
          iconColor="text-violet-600"
        />
        <StatCard
          label="Active Sites"
          value={String(stats.activeSites)}
          icon={<PiUsersBold className="w-5 h-5" />}
          iconBgColor="bg-sky-100"
          iconColor="text-sky-600"
          subtitle={stats.totalSites > 0 ? `${Math.round((stats.activeSites / stats.totalSites) * 100)}% deployed` : undefined}
        />
        <StatCard
          label="Pending Sites"
          value={String(stats.pendingSites)}
          icon={<PiClockBold className="w-5 h-5" />}
          iconBgColor="bg-amber-100"
          iconColor="text-amber-600"
          subtitle="Awaiting deployment"
        />
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex-1 min-w-[240px] relative">
          <PiMagnifyingGlassBold className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by company name, code, or contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9 text-sm"
          />
        </form>

        <div className="flex items-center gap-1 text-sm text-slate-500">
          <PiFunnelBold className="w-4 h-4" />
        </div>

        <Select value={statusFilter} onValueChange={(value) => {
          setStatusFilter(value);
          setPagination(prev => ({ ...prev, page: 1 }));
        }}>
          <SelectTrigger className="w-[150px] h-9 text-sm">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Button type="submit" variant="outline" size="sm" onClick={() => { setPagination(p => ({ ...p, page: 1 })); fetchCorporates(); }}>
          Search
        </Button>

        <div className="ml-auto flex items-center border border-slate-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={cn(
              'px-3 py-1.5 text-sm',
              viewMode === 'list' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
            )}
          >
            Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={cn(
              'px-3 py-1.5 text-sm',
              viewMode === 'grid' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
            )}
          >
            Cards
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
        <span>{loading ? 'Loading...' : <><span className="font-semibold text-slate-900">{pagination.total}</span> corporate{pagination.total !== 1 ? 's' : ''} found</>}</span>
      </div>

      {/* Corporate List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : corporates.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <PiBuildingsBold className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-900 mb-1">No corporate accounts found</p>
          <p className="text-slate-500 text-sm mb-6">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first corporate client'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Button onClick={() => router.push('/admin/corporate/new')}>
              <PiPlusBold className="w-4 h-4 mr-2" />
              Add First Corporate
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* ---- CARDS VIEW ---- */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {corporates.map((corporate) => (
            <CorporateCard
              key={corporate.id}
              corporate={corporate}
              onClick={() => router.push(`/admin/corporate/${corporate.id}`)}
            />
          ))}
        </div>
      ) : (
        /* ---- TABLE VIEW ---- */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Code</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Sites</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {corporates.map((corporate) => {
                const status = STATUS_CONFIG[corporate.accountStatus] ?? STATUS_CONFIG.archived;
                return (
                  <TableRow
                    key={corporate.id}
                    onClick={() => router.push(`/admin/corporate/${corporate.id}`)}
                    className="cursor-pointer group"
                  >
                    <TableCell>
                      <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded text-sm">
                        {corporate.corporateCode}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                          {corporate.companyName}
                        </p>
                        {corporate.tradingName && (
                          <p className="text-xs text-slate-400 truncate">t/a {corporate.tradingName}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-700 truncate">{corporate.primaryContactName}</p>
                        <p className="text-xs text-slate-400 truncate">{corporate.primaryContactEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-600 font-semibold">{corporate.activeSites}</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-slate-600">{corporate.totalSites}</span>
                        {corporate.pendingSites > 0 && (
                          <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded ml-1">
                            +{corporate.pendingSites}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">{corporate.industry || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-xs border', status.color)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', status.dot)} />
                        {corporate.accountStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-400">
                      {new Date(corporate.createdAt).toLocaleDateString('en-ZA', {
                        day: 'numeric', month: 'short',
                      })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-blue-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/corporate/${corporate.id}`);
                        }}
                      >
                        <PiArrowSquareOutBold className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <p className="text-sm text-slate-500">
            Showing{' '}
            <span className="font-semibold text-slate-700">
              {(pagination.page - 1) * pagination.limit + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-700">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            of <span className="font-semibold text-slate-700">{pagination.total}</span> results
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            >
              <PiCaretLeftBold className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum: number;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPagination((prev) => ({ ...prev, page: pageNum }))}
                    className={cn(
                      'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                      pagination.page === pageNum
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
              <PiCaretRightBold className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
