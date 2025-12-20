'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  DiagnosticsListResponse,
  DiagnosticsSummary,
  HealthStatus,
} from '@/lib/diagnostics/types'

// Modern stat card component matching dashboard design
interface DiagnosticsStatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  iconBgColor: string
  iconColor: string
  trend?: { value: number; isPositive: boolean }
  subtitle?: string
  onClick?: () => void
  isActive?: boolean
}

function DiagnosticsStatCard({
  title,
  value,
  icon,
  iconBgColor,
  iconColor,
  trend,
  subtitle,
  onClick,
  isActive,
}: DiagnosticsStatCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden border bg-white shadow-sm rounded-lg transition-all duration-200 cursor-pointer',
        isActive
          ? 'border-circleTel-orange ring-2 ring-circleTel-orange/20'
          : 'border-gray-200 hover:shadow-md hover:border-circleTel-orange/30'
      )}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', iconBgColor)}>
            <div className={iconColor}>{icon}</div>
          </div>
          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 text-sm font-semibold',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}
            >
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{trend.value}%</span>
            </div>
          )}
        </div>

        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>

        {subtitle && <p className="text-xs text-gray-500 mt-2">{subtitle}</p>}
      </div>
    </div>
  )
}

export default function DiagnosticsPage() {
  const router = useRouter()
  const [data, setData] = React.useState<DiagnosticsListResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<HealthStatus | 'all'>('all')
  const [sortBy, setSortBy] = React.useState('health_score')
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc')
  const [page, setPage] = React.useState(1)

  React.useEffect(() => {
    fetchDiagnostics()
  }, [statusFilter, sortBy, sortOrder, page])

  const fetchDiagnostics = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        health_status: statusFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
      })

      if (searchQuery) {
        params.set('search', searchQuery)
      }

      const response = await fetch(`/api/admin/diagnostics?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch diagnostics')
      }

      setData(result)
    } catch (error) {
      console.error('Error fetching diagnostics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchDiagnostics()
  }

  const handleRefresh = () => {
    fetchDiagnostics(true)
  }

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60)
      return `${mins}m`
    }
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${mins}m`
  }

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString('en-ZA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getHealthStatusBadge = (status: HealthStatus, score: number) => {
    const config: Record<
      HealthStatus,
      { bg: string; text: string; icon: React.ReactNode }
    > = {
      healthy: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      },
      warning: {
        bg: 'bg-amber-100',
        text: 'text-amber-800',
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
      },
      critical: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: <XCircle className="w-3.5 h-3.5" />,
      },
      offline: {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        icon: <WifiOff className="w-3.5 h-3.5" />,
      },
      unknown: {
        bg: 'bg-gray-50',
        text: 'text-gray-500',
        icon: <HelpCircle className="w-3.5 h-3.5" />,
      },
    }

    const { bg, text, icon } = config[status]

    return (
      <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', bg, text)}>
        {icon}
        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
        <span className="opacity-60">({score})</span>
      </div>
    )
  }

  const getSessionStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          Online
        </div>
      )
    }
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
        <div className="h-2 w-2 bg-gray-400 rounded-full" />
        Offline
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header - matching dashboard style */}
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Network Diagnostics</h1>
            <p className="text-sm text-gray-500 mt-1">
              Monitor subscriber connection health and troubleshoot issues
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-circleTel-orange hover:bg-orange-600 gap-2"
          >
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Modern Stats Grid - 4 columns like dashboard */}
      {data?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DiagnosticsStatCard
            title="Total Subscribers"
            value={data.stats.total}
            icon={<Activity className="h-5 w-5" />}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
            subtitle="All monitored connections"
            onClick={() => setStatusFilter('all')}
            isActive={statusFilter === 'all'}
          />

          <DiagnosticsStatCard
            title="Healthy"
            value={data.stats.healthy}
            icon={<CheckCircle2 className="h-5 w-5" />}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
            subtitle="Connections running smoothly"
            onClick={() => setStatusFilter('healthy')}
            isActive={statusFilter === 'healthy'}
          />

          <DiagnosticsStatCard
            title="Needs Attention"
            value={data.stats.warning + data.stats.critical}
            icon={<AlertTriangle className="h-5 w-5" />}
            iconBgColor="bg-amber-100"
            iconColor="text-amber-600"
            subtitle={`${data.stats.warning} warning, ${data.stats.critical} critical`}
            onClick={() => setStatusFilter('warning')}
            isActive={statusFilter === 'warning' || statusFilter === 'critical'}
          />

          <DiagnosticsStatCard
            title="Offline"
            value={data.stats.offline}
            icon={<WifiOff className="h-5 w-5" />}
            iconBgColor="bg-gray-100"
            iconColor="text-gray-600"
            subtitle="Currently disconnected"
            onClick={() => setStatusFilter('offline')}
            isActive={statusFilter === 'offline'}
          />
        </div>
      )}

      {/* Critical Alert Banner - if any critical issues */}
      {data?.stats && data.stats.critical > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-xl p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-500 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {data.stats.critical} Critical Connection{data.stats.critical !== 1 ? 's' : ''}
              </h3>
              <p className="text-gray-700 mb-4">
                There are subscribers experiencing severe connection issues that require immediate attention.
              </p>
              <Button
                onClick={() => setStatusFilter('critical')}
                className="bg-red-600 hover:bg-red-700 font-semibold shadow-md"
              >
                <XCircle className="w-4 h-4 mr-2" />
                View Critical Issues
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Subscriber Health Card - matching dashboard card style */}
      <div className="border border-gray-200 bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Subscriber Health</h2>
            <span className="text-sm text-gray-500">
              {data?.pagination.total || 0} subscribers monitored
            </span>
          </div>
        </div>
        <div className="p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, email, or subscriber ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-circleTel-orange focus:ring-circleTel-orange/20"
                />
              </div>
              <Button type="submit" variant="secondary" className="bg-gray-100 hover:bg-gray-200">
                Search
              </Button>
            </form>

            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as HealthStatus | 'all')}>
                <SelectTrigger className="w-[140px] border-gray-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="healthy">Healthy</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px] border-gray-200">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="health_score">Health Score</SelectItem>
                  <SelectItem value="lost_carrier_count_today">Drops Today</SelectItem>
                  <SelectItem value="last_check_at">Last Check</SelectItem>
                  <SelectItem value="customer_name">Customer Name</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                className="border-gray-200 hover:bg-gray-100"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>

          {/* Table / Loading / Empty State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange mb-4" />
              <p className="text-gray-500">Loading diagnostics...</p>
            </div>
          ) : !data?.data?.length ? (
            <div className="text-center py-16">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-700 mb-1">No diagnostics data found</p>
              <p className="text-sm text-gray-500">
                Diagnostics will appear here once subscribers are connected
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200">
                      <TableHead className="text-gray-600 font-semibold">Customer</TableHead>
                      <TableHead className="text-gray-600 font-semibold">Package</TableHead>
                      <TableHead className="text-gray-600 font-semibold">Health</TableHead>
                      <TableHead className="text-gray-600 font-semibold">Session</TableHead>
                      <TableHead className="text-center text-gray-600 font-semibold">Drops Today</TableHead>
                      <TableHead className="text-center text-gray-600 font-semibold">7-Day Activity</TableHead>
                      <TableHead className="text-gray-600 font-semibold">Last Check</TableHead>
                      <TableHead className="text-right text-gray-600 font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((item: DiagnosticsSummary) => (
                      <TableRow
                        key={item.diagnostics_id}
                        className="cursor-pointer hover:bg-gray-50 border-gray-100 transition-colors"
                        onClick={() => router.push(`/admin/diagnostics/${item.customer_service_id}`)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-semibold text-gray-900">{item.customer_name}</p>
                            <p className="text-sm text-gray-500">{item.customer_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{item.package_name}</p>
                            <p className="text-xs text-gray-400 truncate max-w-[200px]">
                              {item.installation_address}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getHealthStatusBadge(item.health_status, item.health_score)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {getSessionStatusBadge(item.is_session_active)}
                            {item.is_session_active && item.last_session_duration_seconds > 0 && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDuration(item.last_session_duration_seconds)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={cn(
                              'font-bold text-lg',
                              item.lost_carrier_count_today >= 5
                                ? 'text-red-600'
                                : item.lost_carrier_count_today >= 3
                                ? 'text-amber-600'
                                : 'text-gray-600'
                            )}
                          >
                            {item.lost_carrier_count_today}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-medium text-gray-900">{item.total_sessions_7days}</span>
                            <span className="text-xs text-gray-500">sessions</span>
                            {item.lost_carrier_count_7days > 0 && (
                              <span className="text-xs text-red-500 font-medium">
                                {item.lost_carrier_count_7days} drops
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="text-gray-700">{formatDate(item.last_check_at)}</p>
                            {item.critical_events_24h > 0 && (
                              <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                <AlertTriangle className="w-3 h-3" />
                                {item.critical_events_24h} critical
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-circleTel-orange hover:text-orange-700 hover:bg-orange-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/admin/diagnostics/${item.customer_service_id}`)
                            }}
                          >
                            View
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data.pagination.total_pages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Showing{' '}
                    <span className="font-medium text-gray-700">
                      {(page - 1) * 20 + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium text-gray-700">
                      {Math.min(page * 20, data.pagination.total)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium text-gray-700">{data.pagination.total}</span>{' '}
                    subscribers
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="border-gray-200 hover:bg-gray-50"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= data.pagination.total_pages}
                      className="border-gray-200 hover:bg-gray-50"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
