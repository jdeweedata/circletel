'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  AlertCircle,
  Briefcase,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface CorporateAccount {
  id: string;
  corporateCode: string;
  companyName: string;
  tradingName?: string | null;
  primaryContactName: string;
  primaryContactEmail: string;
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
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');

  React.useEffect(() => {
    fetchCorporates();
    fetchStats();
  }, [pagination.page, statusFilter, searchQuery]);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800">Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Corporate Clients</h1>
          <p className="text-gray-500 mt-1">Manage enterprise multi-site accounts</p>
        </div>
        <Button onClick={() => router.push('/admin/corporate/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Corporate
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Corporates</p>
                <p className="text-2xl font-bold">{stats.totalCorporates}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Corporates</p>
                <p className="text-2xl font-bold">{stats.activeCorporates}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Sites</p>
                <p className="text-2xl font-bold">{stats.totalSites}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Sites</p>
                <p className="text-2xl font-bold">{stats.activeSites}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Sites</p>
                <p className="text-2xl font-bold">{stats.pendingSites}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, code, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
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

            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {/* Corporate List */}
      <Card>
        <CardHeader>
          <CardTitle>Corporate Accounts</CardTitle>
          <CardDescription>
            {pagination.total} corporate{pagination.total !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-blue-600 rounded-full mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading corporates...</p>
            </div>
          ) : corporates.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-300 mx-auto" />
              <p className="text-gray-500 mt-4">No corporate accounts found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/admin/corporate/new')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Corporate
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Primary Contact</TableHead>
                    <TableHead>Sites</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {corporates.map((corporate) => (
                    <TableRow
                      key={corporate.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/admin/corporate/${corporate.id}`)}
                    >
                      <TableCell>
                        <span className="font-mono font-semibold text-blue-600">
                          {corporate.corporateCode}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{corporate.companyName}</p>
                          {corporate.tradingName && (
                            <p className="text-sm text-gray-500">t/a {corporate.tradingName}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{corporate.primaryContactName}</p>
                          <p className="text-sm text-gray-500">{corporate.primaryContactEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 font-medium">{corporate.activeSites}</span>
                          <span className="text-gray-400">/</span>
                          <span>{corporate.totalSites}</span>
                          {corporate.pendingSites > 0 && (
                            <Badge variant="outline" className="ml-1">
                              {corporate.pendingSites} pending
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-600">{corporate.industry || '-'}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(corporate.accountStatus)}</TableCell>
                      <TableCell>
                        <span className="text-gray-500 text-sm">
                          {new Date(corporate.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/corporate/${corporate.id}`);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} results
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
