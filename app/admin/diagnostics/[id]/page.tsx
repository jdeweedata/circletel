'use client'

import React from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  Activity,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  Package,
  Ticket,
  TrendingDown,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Play,
  Loader2,
  ArrowUpDown,
  Calendar,
  Signal,
  Zap,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  DiagnosticsDetailResponse,
  SubscriberEvent,
  HealthStatus,
  Severity,
} from '@/lib/diagnostics/types'

// Stat card component for summary metrics
interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  iconBgColor: string
  iconColor: string
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
}

function StatCard({ title, value, icon, iconBgColor, iconColor, subtitle, trend }: StatCardProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
      <div className="flex items-start justify-between">
        <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', iconBgColor)}>
          <div className={iconColor}>{icon}</div>
        </div>
        {trend && trend !== 'neutral' && (
          <div className={cn('text-xs font-medium', trend === 'up' ? 'text-green-600' : 'text-red-600')}>
            {trend === 'up' ? '↑' : '↓'}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-3">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  )
}

export default function DiagnosticsDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [data, setData] = React.useState<DiagnosticsDetailResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [analyzing, setAnalyzing] = React.useState(false)

  React.useEffect(() => {
    if (id) {
      fetchDiagnostics()
    }
  }, [id])

  const fetchDiagnostics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/diagnostics/${id}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch diagnostics')
      }

      setData(result)
    } catch (error) {
      console.error('Error fetching diagnostics:', error)
    } finally {
      setLoading(false)
    }
  }

  const triggerAnalysis = async () => {
    setAnalyzing(true)
    try {
      const response = await fetch(`/api/admin/diagnostics/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force_refresh: true }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Analysis failed')
      }

      // Refresh data after analysis
      await fetchDiagnostics()
    } catch (error) {
      console.error('Error running analysis:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}m ${secs}s`
    }
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${mins}m`
  }

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const formatRelativeTime = (dateString: string | null): string => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const getHealthStatusConfig = (status: HealthStatus) => {
    const config: Record<HealthStatus, {
      color: string
      bgColor: string
      borderColor: string
      icon: React.ReactNode
      label: string
    }> = {
      healthy: {
        color: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: <CheckCircle2 className="w-8 h-8 text-green-500" />,
        label: 'Healthy',
      },
      warning: {
        color: 'text-amber-700',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        icon: <AlertTriangle className="w-8 h-8 text-amber-500" />,
        label: 'Warning',
      },
      critical: {
        color: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: <XCircle className="w-8 h-8 text-red-500" />,
        label: 'Critical',
      },
      offline: {
        color: 'text-gray-700',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        icon: <WifiOff className="w-8 h-8 text-gray-500" />,
        label: 'Offline',
      },
      unknown: {
        color: 'text-gray-500',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        icon: <HelpCircle className="w-8 h-8 text-gray-400" />,
        label: 'Unknown',
      },
    }
    return config[status]
  }

  const getSeverityBadge = (severity: Severity) => {
    const config: Record<Severity, { bg: string; text: string }> = {
      critical: { bg: 'bg-red-100', text: 'text-red-800' },
      high: { bg: 'bg-orange-100', text: 'text-orange-800' },
      medium: { bg: 'bg-amber-100', text: 'text-amber-800' },
      low: { bg: 'bg-blue-100', text: 'text-blue-800' },
      info: { bg: 'bg-gray-100', text: 'text-gray-700' },
    }
    const { bg, text } = config[severity]
    return (
      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', bg, text)}>
        {severity}
      </span>
    )
  }

  const getEventTypeBadge = (eventType: string) => {
    const typeConfig: Record<string, { bg: string; text: string }> = {
      session_start: { bg: 'bg-green-100', text: 'text-green-800' },
      session_end: { bg: 'bg-gray-100', text: 'text-gray-700' },
      lost_carrier: { bg: 'bg-red-100', text: 'text-red-800' },
      user_request: { bg: 'bg-blue-100', text: 'text-blue-800' },
      health_check: { bg: 'bg-purple-100', text: 'text-purple-800' },
      ticket_created: { bg: 'bg-amber-100', text: 'text-amber-800' },
      authenticated: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
      nas_updated: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
    }
    const config = typeConfig[eventType] || { bg: 'bg-gray-100', text: 'text-gray-700' }
    return (
      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', config.bg, config.text)}>
        {eventType.replace(/_/g, ' ')}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange mb-4" />
        <p className="text-gray-500">Loading diagnostics...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-lg font-medium text-gray-700 mb-1">Diagnostics not found</p>
        <p className="text-sm text-gray-500 mb-4">Unable to load diagnostics for this subscriber</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  const { diagnostics, customer, service, recent_events, open_tickets } = data
  const healthConfig = getHealthStatusConfig(diagnostics.health_status as HealthStatus)

  return (
    <div className="space-y-8">
      {/* Header - matching dashboard style */}
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{customer.name}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {service.package_name} • {customer.account_number || customer.email}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchDiagnostics}
              className="border-gray-200 hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={triggerAnalysis}
              disabled={analyzing}
              className="bg-circleTel-orange hover:bg-orange-600"
            >
              {analyzing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {analyzing ? 'Analyzing...' : 'Run Analysis'}
            </Button>
          </div>
        </div>
      </div>

      {/* Health Status Banner */}
      <div className={cn(
        'rounded-xl p-6 border-2',
        healthConfig.bgColor,
        healthConfig.borderColor
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn('p-3 rounded-lg', healthConfig.bgColor)}>
              {healthConfig.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={cn('text-xl font-bold', healthConfig.color)}>
                  {healthConfig.label}
                </h2>
                <span className="text-gray-500">•</span>
                <span className="text-lg font-semibold text-gray-700">
                  Score: {diagnostics.health_score}/100
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Last checked {formatRelativeTime(diagnostics.last_check_at)}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className={cn(
                'text-3xl font-bold',
                diagnostics.lost_carrier_count_today >= 3 ? 'text-red-600' : 'text-gray-900'
              )}>
                {diagnostics.lost_carrier_count_today}
              </p>
              <p className="text-sm text-gray-500">Drops Today</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{diagnostics.total_sessions_today}</p>
              <p className="text-sm text-gray-500">Sessions Today</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{diagnostics.total_sessions_7days}</p>
              <p className="text-sm text-gray-500">Sessions 7d</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer & Service Info Card */}
        <div className="border border-gray-200 bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Customer Details</h2>
              <Link
                href={`/admin/customers/${customer.id || ''}`}
                className="text-sm font-semibold text-circleTel-orange hover:underline flex items-center gap-1"
              >
                View Profile
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{customer.name}</p>
                {customer.account_number && (
                  <p className="text-sm text-gray-500">{customer.account_number}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <a href={`mailto:${customer.email}`} className="text-circleTel-orange hover:underline">
                {customer.email}
              </a>
            </div>

            {customer.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <a href={`tel:${customer.phone}`} className="text-circleTel-orange hover:underline">
                  {customer.phone}
                </a>
              </div>
            )}

            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <p className="text-sm text-gray-700">{service.installation_address}</p>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-circleTel-orange" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{service.package_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={cn(
                    'h-2 w-2 rounded-full',
                    service.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                  )} />
                  <span className={cn(
                    'text-sm font-medium',
                    service.status === 'active' ? 'text-green-700' : 'text-gray-600'
                  )}>
                    {service.status === 'active' ? 'Active' : service.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Session Status Card */}
        <div className="border border-gray-200 bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Session Status</h2>
          </div>
          <div className="p-6 space-y-4">
            {/* Current Session */}
            <div className={cn(
              'flex items-center gap-4 p-4 rounded-lg border',
              diagnostics.is_session_active
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200'
            )}>
              <div className={cn(
                'h-12 w-12 rounded-lg flex items-center justify-center',
                diagnostics.is_session_active ? 'bg-green-100' : 'bg-gray-100'
              )}>
                {diagnostics.is_session_active ? (
                  <Wifi className="w-6 h-6 text-green-600" />
                ) : (
                  <WifiOff className="w-6 h-6 text-gray-500" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className={cn(
                    'text-lg font-bold',
                    diagnostics.is_session_active ? 'text-green-700' : 'text-gray-700'
                  )}>
                    {diagnostics.is_session_active ? 'Online' : 'Offline'}
                  </p>
                  {diagnostics.is_session_active && (
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  )}
                </div>
                {diagnostics.is_session_active && diagnostics.current_session_ip && (
                  <p className="text-sm text-gray-600">IP: {diagnostics.current_session_ip}</p>
                )}
              </div>
            </div>

            {/* Session Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              {diagnostics.last_session_start && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <p className="text-xs text-gray-500">Session Started</p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {formatRelativeTime(diagnostics.last_session_start)}
                  </p>
                </div>
              )}

              {diagnostics.last_session_duration_seconds > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-gray-400" />
                    <p className="text-xs text-gray-500">Duration</p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {formatDuration(diagnostics.last_session_duration_seconds)}
                  </p>
                </div>
              )}
            </div>

            {/* Last Disconnect */}
            {diagnostics.last_terminate_cause && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-3">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-sm text-gray-600">Last Disconnect Reason</p>
                    <p className="font-bold text-red-700">{diagnostics.last_terminate_cause}</p>
                    {diagnostics.last_disconnect_time && (
                      <p className="text-xs text-gray-500 mt-1">
                        {formatRelativeTime(diagnostics.last_disconnect_time)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* NAS Info */}
            {diagnostics.nas_ip_address && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Signal className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">NAS IP Address</p>
                  <p className="font-mono text-sm text-gray-900">{diagnostics.nas_ip_address}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 7-Day Summary Card */}
      <div className="border border-gray-200 bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">7-Day Summary</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              Last 7 days
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Total Sessions"
              value={diagnostics.total_sessions_7days}
              icon={<Activity className="h-5 w-5" />}
              iconBgColor="bg-blue-100"
              iconColor="text-blue-600"
            />
            <StatCard
              title="Connection Drops"
              value={diagnostics.lost_carrier_count_7days}
              icon={<TrendingDown className="h-5 w-5" />}
              iconBgColor="bg-red-100"
              iconColor="text-red-600"
              trend={diagnostics.lost_carrier_count_7days > 5 ? 'down' : 'neutral'}
            />
            <StatCard
              title="Total Online Time"
              value={formatDuration(diagnostics.total_online_seconds_7days)}
              icon={<Clock className="h-5 w-5" />}
              iconBgColor="bg-green-100"
              iconColor="text-green-600"
            />
            <StatCard
              title="Avg Session"
              value={formatDuration(diagnostics.avg_session_duration_seconds)}
              icon={<Zap className="h-5 w-5" />}
              iconBgColor="bg-purple-100"
              iconColor="text-purple-600"
            />
          </div>
        </div>
      </div>

      {/* Open Tickets */}
      {open_tickets.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-300 rounded-xl p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500 rounded-lg">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {open_tickets.length} Open Ticket{open_tickets.length !== 1 ? 's' : ''}
              </h3>
              <div className="space-y-2">
                {open_tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => router.push(`/admin/support/tickets/${ticket.id}`)}
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{ticket.ticket_number}</p>
                      <p className="text-sm text-gray-600">{ticket.subject}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        {ticket.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatRelativeTime(ticket.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Events Table */}
      <div className="border border-gray-200 bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Recent Events</h2>
            <span className="text-sm text-gray-500">
              Last 50 events
            </span>
          </div>
        </div>
        <div className="p-6">
          {recent_events.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-700 mb-1">No events recorded</p>
              <p className="text-sm text-gray-500">
                Events will appear here as the subscriber connects
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="text-gray-600 font-semibold">Time</TableHead>
                    <TableHead className="text-gray-600 font-semibold">Type</TableHead>
                    <TableHead className="text-gray-600 font-semibold">Source</TableHead>
                    <TableHead className="text-gray-600 font-semibold">Severity</TableHead>
                    <TableHead className="text-gray-600 font-semibold">Session</TableHead>
                    <TableHead className="text-gray-600 font-semibold">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent_events.map((event: SubscriberEvent) => (
                    <TableRow key={event.id} className="hover:bg-gray-50 border-gray-100">
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{formatRelativeTime(event.created_at)}</p>
                          <p className="text-xs text-gray-400">{formatDate(event.created_at)}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getEventTypeBadge(event.event_type)}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {event.event_source}
                        </span>
                      </TableCell>
                      <TableCell>{getSeverityBadge(event.severity as Severity)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {event.session_active ? (
                            <div className="flex items-center gap-1.5">
                              <div className="h-2 w-2 bg-green-500 rounded-full" />
                              <span className="text-xs text-green-700">Online</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <div className="h-2 w-2 bg-gray-400 rounded-full" />
                              <span className="text-xs text-gray-600">Offline</span>
                            </div>
                          )}
                          {event.session_ip && (
                            <span className="text-xs text-gray-500 font-mono">{event.session_ip}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {event.terminate_cause && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {event.terminate_cause}
                            </span>
                          )}
                          {event.health_impact !== 0 && (
                            <span className={cn(
                              'text-sm font-semibold',
                              event.health_impact > 0 ? 'text-green-600' : 'text-red-600'
                            )}>
                              {event.health_impact > 0 ? '+' : ''}{event.health_impact}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
