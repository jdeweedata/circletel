'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  TrendingDown,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react'
import type {
  DiagnosticsListResponse,
  DiagnosticsSummary,
  HealthStatus,
} from '@/lib/diagnostics/types'

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
    const config: Record<HealthStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode; className: string }> = {
      healthy: {
        variant: 'default',
        icon: <CheckCircle2 className="w-3 h-3 mr-1" />,
        className: 'bg-green-500 hover:bg-green-600',
      },
      warning: {
        variant: 'secondary',
        icon: <AlertTriangle className="w-3 h-3 mr-1" />,
        className: 'bg-amber-500 hover:bg-amber-600 text-white',
      },
      critical: {
        variant: 'destructive',
        icon: <XCircle className="w-3 h-3 mr-1" />,
        className: '',
      },
      offline: {
        variant: 'outline',
        icon: <WifiOff className="w-3 h-3 mr-1" />,
        className: 'bg-gray-500 hover:bg-gray-600 text-white border-gray-500',
      },
      unknown: {
        variant: 'outline',
        icon: <HelpCircle className="w-3 h-3 mr-1" />,
        className: '',
      },
    }

    const { variant, icon, className } = config[status]

    return (
      <Badge variant={variant} className={`flex items-center ${className}`}>
        {icon}
        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
        <span className="ml-1 text-xs opacity-75">({score})</span>
      </Badge>
    )
  }

  const getSessionStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <Badge variant="outline" className="flex items-center bg-green-100 text-green-800 border-green-300">
          <Wifi className="w-3 h-3 mr-1" />
          Online
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="flex items-center bg-gray-100 text-gray-600 border-gray-300">
        <WifiOff className="w-3 h-3 mr-1" />
        Offline
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Network Diagnostics</h1>
          <p className="text-gray-500">Monitor subscriber connection health and troubleshoot issues</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {data?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('all')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total</p>
                  <p className="text-2xl font-bold">{data.stats.total}</p>
                </div>
                <Activity className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('healthy')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Healthy</p>
                  <p className="text-2xl font-bold text-green-600">{data.stats.healthy}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('warning')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Warning</p>
                  <p className="text-2xl font-bold text-amber-600">{data.stats.warning}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('critical')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Critical</p>
                  <p className="text-2xl font-bold text-red-600">{data.stats.critical}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('offline')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Offline</p>
                  <p className="text-2xl font-bold text-gray-600">{data.stats.offline}</p>
                </div>
                <WifiOff className="w-8 h-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('unknown')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Unknown</p>
                  <p className="text-2xl font-bold text-gray-400">{data.stats.unknown}</p>
                </div>
                <HelpCircle className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Subscriber Health</CardTitle>
          <CardDescription>
            View and manage subscriber connection diagnostics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, email, or subscriber ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </form>

            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as HealthStatus | 'all')}>
                <SelectTrigger className="w-[140px]">
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
                <SelectTrigger className="w-[160px]">
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
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading diagnostics...</span>
            </div>
          ) : !data?.data?.length ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No diagnostics data found</p>
              <p className="text-sm text-gray-400 mt-1">
                Diagnostics will appear here once subscribers are connected
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Health</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead className="text-center">Drops Today</TableHead>
                    <TableHead className="text-center">Sessions 7d</TableHead>
                    <TableHead>Last Check</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((item: DiagnosticsSummary) => (
                    <TableRow
                      key={item.diagnostics_id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/admin/diagnostics/${item.customer_service_id}`)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.customer_name}</p>
                          <p className="text-sm text-gray-500">{item.customer_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.package_name}</p>
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
                        <span className={`font-medium ${item.lost_carrier_count_today >= 5 ? 'text-red-600' : item.lost_carrier_count_today >= 3 ? 'text-amber-600' : 'text-gray-600'}`}>
                          {item.lost_carrier_count_today}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-gray-600">{item.total_sessions_7days}</span>
                        {item.lost_carrier_count_7days > 0 && (
                          <span className="text-xs text-red-500 ml-1">
                            ({item.lost_carrier_count_7days} drops)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{formatDate(item.last_check_at)}</p>
                          {item.critical_events_24h > 0 && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {item.critical_events_24h} critical events
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/admin/diagnostics/${item.customer_service_id}`)
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
              {data.pagination.total_pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.pagination.total)} of {data.pagination.total} subscribers
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= data.pagination.total_pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
