'use client';

/**
 * Admin B2B Customers Page
 *
 * Displays all business customers with their journey status and management options.
 *
 * @module app/admin/b2b-customers/page
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Search,
  Filter,
  MoreHorizontal,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { JourneyProgressTracker } from '@/components/business-dashboard/journey';
import { B2B_JOURNEY_STAGES, JourneyStageId } from '@/lib/business/journey-config';
import { Skeleton } from '@/components/ui/skeleton';

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
  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    pending_verification: { variant: 'secondary', label: 'Pending Verification' },
    verification_in_progress: { variant: 'secondary', label: 'Verifying' },
    active: { variant: 'default', label: 'Active' },
    suspended: { variant: 'destructive', label: 'Suspended' },
    cancelled: { variant: 'outline', label: 'Cancelled' },
    dormant: { variant: 'outline', label: 'Dormant' },
  };
  const config = variants[status] || { variant: 'outline', label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function getStageName(stageId: JourneyStageId): string {
  const stage = B2B_JOURNEY_STAGES.find((s) => s.id === stageId);
  return stage?.shortTitle || stageId;
}

// ============================================================================
// Stats Cards Component
// ============================================================================

function StatsCards({ stats, loading }: { stats: Stats | null; loading: boolean }) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Customers',
      value: stats.total,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active',
      value: stats.byStatus.active || 0,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Pending Verification',
      value: stats.byStatus.pending_verification || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Blocked',
      value: stats.blocked || 0,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-circleTel-orange" />
            B2B Customers
          </h1>
          <p className="text-gray-600 mt-1">
            Manage business customers and track their onboarding journey
          </p>
        </div>
        <Button
          onClick={() => router.push('/admin/quotes?type=business')}
          className="bg-circleTel-orange hover:bg-orange-600"
        >
          View Business Quotes
        </Button>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} loading={loading} />

      {/* Journey Stage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Journey Stage Distribution</CardTitle>
          <CardDescription>
            Customers by current stage in the onboarding journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {B2B_JOURNEY_STAGES.map((stage) => {
              const count = stats?.byStage[stage.id] || 0;
              return (
                <button
                  key={stage.id}
                  onClick={() => setStageFilter(stage.id)}
                  className={`p-4 rounded-lg border-2 transition-all hover:border-circleTel-orange ${
                    stageFilter === stage.id
                      ? 'border-circleTel-orange bg-orange-50'
                      : 'border-gray-200'
                  }`}
                >
                  <stage.icon className="h-6 w-6 text-circleTel-orange mb-2" />
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-gray-600">{stage.shortTitle}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by company, email, or account number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
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
          <SelectTrigger className="w-[180px]">
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
        {(statusFilter !== 'all' || stageFilter !== 'all' || search) && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
              setStageFilter('all');
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Customer Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Journey Progress</TableHead>
                <TableHead>Current Stage</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No business customers found
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/admin/b2b-customers/${customer.id}`)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{customer.company_name}</p>
                        <p className="text-sm text-gray-500">
                          {customer.primary_contact_email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {customer.account_number}
                      </code>
                    </TableCell>
                    <TableCell>{getStatusBadge(customer.account_status)}</TableCell>
                    <TableCell>
                      {customer.journey ? (
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-circleTel-orange h-2 rounded-full transition-all"
                              style={{
                                width: `${customer.journey.progressPercentage}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">
                            {customer.journey.progressPercentage}%
                          </span>
                          {customer.journey.blockedStage && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Not started</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {customer.journey ? (
                        <Badge
                          variant={
                            customer.journey.blockedStage ? 'destructive' : 'secondary'
                          }
                        >
                          {getStageName(customer.journey.currentStage)}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/b2b-customers/${customer.id}`);
                            }}
                          >
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/admin/b2b-customers/${customer.id}/journey`
                              );
                            }}
                          >
                            Manage Journey
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/admin/b2b-customers/${customer.id}/documents`
                              );
                            }}
                          >
                            View Documents
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
