'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Building2,
  Plus,
  MapPin,
  Users,
  CheckCircle,
  Clock,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  TrendingUp,
  Filter,
  LayoutGrid,
  List,
  Mail,
  Phone,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

// Stat card component
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  trend,
  subtitle,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: 'orange' | 'emerald' | 'violet' | 'sky' | 'amber';
  trend?: number;
  subtitle?: string;
}) {
  const colorMap = {
    orange: {
      bg: 'bg-gradient-to-br from-orange-500 to-orange-600',
      light: 'bg-orange-50',
      text: 'text-orange-600',
      shadow: 'shadow-orange-500/20',
    },
    emerald: {
      bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      light: 'bg-emerald-50',
      text: 'text-emerald-600',
      shadow: 'shadow-emerald-500/20',
    },
    violet: {
      bg: 'bg-gradient-to-br from-violet-500 to-violet-600',
      light: 'bg-violet-50',
      text: 'text-violet-600',
      shadow: 'shadow-violet-500/20',
    },
    sky: {
      bg: 'bg-gradient-to-br from-sky-500 to-sky-600',
      light: 'bg-sky-50',
      text: 'text-sky-600',
      shadow: 'shadow-sky-500/20',
    },
    amber: {
      bg: 'bg-gradient-to-br from-amber-500 to-amber-600',
      light: 'bg-amber-50',
      text: 'text-amber-600',
      shadow: 'shadow-amber-500/20',
    },
  };

  const colors = colorMap[color];

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shadow-lg', colors.bg, colors.shadow)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend !== undefined && (
          <div className={cn('flex items-center gap-1 text-xs font-medium', trend >= 0 ? 'text-emerald-600' : 'text-red-500')}>
            <TrendingUp className={cn('w-3 h-3', trend < 0 && 'rotate-180')} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-ui-text-primary tracking-tight">{value.toLocaleString()}</p>
        <p className="card-title mt-1">{label}</p>
        {subtitle && <p className="muted-text-sm mt-0.5">{subtitle}</p>}
      </div>
      {/* Decorative corner accent */}
      <div className={cn('absolute top-0 right-0 w-20 h-20 opacity-5 rounded-tr-2xl', colors.bg)}
        style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />
    </div>
  );
}

// Corporate card component for grid view
function CorporateCard({
  corporate,
  onClick,
}: {
  corporate: CorporateAccount;
  onClick: () => void;
}) {
  const statusConfig = {
    active: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    pending: { color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    suspended: { color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
    archived: { color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  };

  const status = statusConfig[corporate.accountStatus];
  const siteProgress = corporate.totalSites > 0 ? (corporate.activeSites / corporate.totalSites) * 100 : 0;

  return (
    <button
      onClick={onClick}
      className="group relative w-full text-left bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center border border-slate-200">
            <span className="text-sm font-bold font-mono text-orange-600">{corporate.corporateCode}</span>
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-ui-text-primary truncate group-hover:text-circleTel-orange transition-colors">
              {corporate.companyName}
            </h3>
            {corporate.tradingName && (
              <p className="muted-text-sm truncate">t/a {corporate.tradingName}</p>
            )}
          </div>
        </div>
        <Badge className={cn('text-xs border', status.color)}>
          <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', status.dot)} />
          {corporate.accountStatus}
        </Badge>
      </div>

      {/* Sites Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="muted-text">Sites</span>
          <span className="font-semibold text-ui-text-primary">
            <span className="text-emerald-600">{corporate.activeSites}</span>
            <span className="text-ui-border mx-1">/</span>
            {corporate.totalSites}
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${siteProgress}%` }}
          />
        </div>
        {corporate.pendingSites > 0 && (
          <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {corporate.pendingSites} pending deployment
          </p>
        )}
      </div>

      {/* Contact */}
      <div className="pt-4 border-t border-ui-border">
        <p className="body-text font-medium truncate">{corporate.primaryContactName}</p>
        <p className="muted-text-sm truncate flex items-center gap-1 mt-0.5">
          <Mail className="w-3 h-3" />
          {corporate.primaryContactEmail}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-ui-border">
        {corporate.industry ? (
          <span className="muted-text-sm font-medium bg-ui-bg px-2 py-1 rounded-md">
            {corporate.industry}
          </span>
        ) : (
          <span />
        )}
        <span className="muted-text-sm">
          {new Date(corporate.createdAt).toLocaleDateString('en-ZA', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </span>
      </div>

      {/* Hover Arrow */}
      <div className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowUpRight className="w-4 h-4 text-slate-400" />
      </div>
    </button>
  );
}

export default function CorporateListPage() {
  const router = useRouter();

  const [corporates, setCorporates] = React.useState<CorporateAccount[]>([]);
  const [stats, setStats] = React.useState<CorporateStats>({
    totalCorporates: 0,
    activeCorporates: 0,
    totalSites: 0,
    activeSites: 0,
    pendingSites: 0,
  });
  const [pagination, setPagination] = React.useState<PaginationInfo>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');

  React.useEffect(() => {
    fetchCorporates();
    fetchStats();
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
        page: data.page,
        limit: data.limit,
        total: data.total,
        totalPages: data.totalPages,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      {/* Background pattern */}
      <div
        className="fixed inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="page-title">
                  Corporate Clients
                </h1>
                <p className="muted-text mt-0.5">
                  Manage enterprise multi-site accounts
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/admin/corporate/new')}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/25 h-11 px-5"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Corporate
            </Button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <StatCard
            label="Total Corporates"
            value={stats.totalCorporates}
            icon={Briefcase}
            color="orange"
          />
          <StatCard
            label="Active Corporates"
            value={stats.activeCorporates}
            icon={CheckCircle}
            color="emerald"
            subtitle={stats.totalCorporates > 0 ? `${Math.round((stats.activeCorporates / stats.totalCorporates) * 100)}% of total` : undefined}
          />
          <StatCard
            label="Total Sites"
            value={stats.totalSites}
            icon={MapPin}
            color="violet"
          />
          <StatCard
            label="Active Sites"
            value={stats.activeSites}
            icon={Users}
            color="sky"
            subtitle={stats.totalSites > 0 ? `${Math.round((stats.activeSites / stats.totalSites) * 100)}% deployed` : undefined}
          />
          <StatCard
            label="Pending Sites"
            value={stats.pendingSites}
            icon={Clock}
            color="amber"
            subtitle="Awaiting deployment"
          />
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 mb-6 shadow-sm">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by company name, code, or contact..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 border-slate-200 bg-slate-50/50 focus:bg-white focus:border-orange-400 focus:ring-orange-400/20"
              />
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}>
                <SelectTrigger className="w-[160px] h-11 border-slate-200 bg-slate-50/50">
                  <Filter className="w-4 h-4 mr-2 text-slate-400" />
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
              <Button type="submit" variant="outline" className="h-11 border-slate-200">
                Search
              </Button>
              <div className="hidden sm:flex border border-slate-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2.5 transition-colors',
                    viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'bg-white text-slate-400 hover:text-slate-600'
                  )}
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2.5 transition-colors',
                    viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'bg-white text-slate-400 hover:text-slate-600'
                  )}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500">
            {loading ? (
              'Loading...'
            ) : (
              <>
                <span className="font-semibold text-slate-900">{pagination.total}</span> corporate{pagination.total !== 1 ? 's' : ''} found
              </>
            )}
          </p>
        </div>

        {/* Corporate List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-orange-500 animate-spin" />
            <p className="text-slate-500 mt-4">Loading corporate accounts...</p>
          </div>
        ) : corporates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-ui-border">
            <div className="w-20 h-20 rounded-2xl bg-ui-bg flex items-center justify-center mb-4">
              <Building2 className="w-10 h-10 text-ui-text-muted" />
            </div>
            <h3 className="section-heading mb-1">No corporate accounts found</h3>
            <p className="muted-text mb-6">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first corporate client'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button
                onClick={() => router.push('/admin/corporate/new')}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Corporate
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
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
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-ui-border bg-ui-bg/50">
                    <th className="text-left text-xs font-semibold text-ui-text-secondary uppercase tracking-wider px-5 py-4">Code</th>
                    <th className="text-left text-xs font-semibold text-ui-text-secondary uppercase tracking-wider px-5 py-4">Company</th>
                    <th className="text-left text-xs font-semibold text-ui-text-secondary uppercase tracking-wider px-5 py-4">Contact</th>
                    <th className="text-left text-xs font-semibold text-ui-text-secondary uppercase tracking-wider px-5 py-4">Sites</th>
                    <th className="text-left text-xs font-semibold text-ui-text-secondary uppercase tracking-wider px-5 py-4">Industry</th>
                    <th className="text-left text-xs font-semibold text-ui-text-secondary uppercase tracking-wider px-5 py-4">Status</th>
                    <th className="text-left text-xs font-semibold text-ui-text-secondary uppercase tracking-wider px-5 py-4">Created</th>
                    <th className="px-5 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {corporates.map((corporate) => {
                    const statusConfig = {
                      active: { color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
                      pending: { color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
                      suspended: { color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
                      archived: { color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
                    };
                    const status = statusConfig[corporate.accountStatus];

                    return (
                      <tr
                        key={corporate.id}
                        onClick={() => router.push(`/admin/corporate/${corporate.id}`)}
                        className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-4">
                          <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md text-sm">
                            {corporate.corporateCode}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">{corporate.companyName}</p>
                            {corporate.tradingName && (
                              <p className="text-xs text-slate-400 truncate">t/a {corporate.tradingName}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="min-w-0">
                            <p className="font-medium text-slate-700 truncate">{corporate.primaryContactName}</p>
                            <p className="text-xs text-slate-400 truncate">{corporate.primaryContactEmail}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
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
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-slate-500 text-sm">{corporate.industry || '—'}</span>
                        </td>
                        <td className="px-5 py-4">
                          <Badge className={cn('text-xs', status.color)}>
                            <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', status.dot)} />
                            {corporate.accountStatus}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-slate-400">
                            {new Date(corporate.createdAt).toLocaleDateString('en-ZA', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-orange-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/corporate/${corporate.id}`);
                            }}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-ui-border">
            <p className="muted-text">
              Showing{' '}
              <span className="font-semibold text-ui-text-secondary">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-700">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-slate-700">{pagination.total}</span> results
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                className="h-9 px-3 border-slate-200"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
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
                          ? 'bg-orange-500 text-white'
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
                className="h-9 px-3 border-slate-200"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
