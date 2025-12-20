'use client'

import React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  TrendingUp,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Play,
} from 'lucide-react'
import type {
  DiagnosticsDetailResponse,
  SubscriberEvent,
  HealthStatus,
  Severity,
} from '@/lib/diagnostics/types'

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
    const config: Record<HealthStatus, { color: string; bgColor: string; icon: React.ReactNode }> = {
      healthy: {
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: <CheckCircle2 className="w-6 h-6 text-green-500" />,
      },
      warning: {
        color: 'text-amber-600',
        bgColor: 'bg-amber-100',
        icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
      },
      critical: {
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        icon: <XCircle className="w-6 h-6 text-red-500" />,
      },
      offline: {
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        icon: <WifiOff className="w-6 h-6 text-gray-500" />,
      },
      unknown: {
        color: 'text-gray-400',
        bgColor: 'bg-gray-50',
        icon: <HelpCircle className="w-6 h-6 text-gray-400" />,
      },
    }
    return config[status]
  }

  const getSeverityBadge = (severity: Severity) => {
    const config: Record<Severity, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
      critical: { variant: 'destructive', className: '' },
      high: { variant: 'destructive', className: 'bg-orange-500 hover:bg-orange-600' },
      medium: { variant: 'secondary', className: 'bg-amber-500 text-white hover:bg-amber-600' },
      low: { variant: 'secondary', className: '' },
      info: { variant: 'outline', className: '' },
    }
    const { variant, className } = config[severity]
    return (
      <Badge variant={variant} className={className}>
        {severity}
      </Badge>
    )
  }

  const getEventTypeBadge = (eventType: string) => {
    const typeColors: Record<string, string> = {
      session_start: 'bg-green-100 text-green-800',
      session_end: 'bg-gray-100 text-gray-800',
      lost_carrier: 'bg-red-100 text-red-800',
      user_request: 'bg-blue-100 text-blue-800',
      health_check: 'bg-purple-100 text-purple-800',
      ticket_created: 'bg-amber-100 text-amber-800',
      authenticated: 'bg-cyan-100 text-cyan-800',
      nas_updated: 'bg-indigo-100 text-indigo-800',
    }
    const className = typeColors[eventType] || 'bg-gray-100 text-gray-800'
    return (
      <Badge variant="outline" className={className}>
        {eventType.replace(/_/g, ' ')}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading diagnostics...</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <XCircle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">Diagnostics data not found</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  const { diagnostics, customer, service, recent_events, open_tickets } = data
  const healthConfig = getHealthStatusConfig(diagnostics.health_status as HealthStatus)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-gray-500">{service.package_name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchDiagnostics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={triggerAnalysis} disabled={analyzing}>
            <Play className="w-4 h-4 mr-2" />
            {analyzing ? 'Analyzing...' : 'Run Analysis'}
          </Button>
        </div>
      </div>

      {/* Health Status Card */}
      <Card className={healthConfig.bgColor}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {healthConfig.icon}
              <div>
                <p className="text-lg font-semibold capitalize">{diagnostics.health_status}</p>
                <p className="text-sm text-gray-600">
                  Health Score: <span className="font-bold">{diagnostics.health_score}/100</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-2xl font-bold">{diagnostics.lost_carrier_count_today}</p>
                <p className="text-sm text-gray-500">Drops Today</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{diagnostics.total_sessions_today}</p>
                <p className="text-sm text-gray-500">Sessions Today</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{diagnostics.total_sessions_7days}</p>
                <p className="text-sm text-gray-500">Sessions 7d</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer & Service Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <p className="font-medium">{customer.name}</p>
                {customer.account_number && (
                  <p className="text-sm text-gray-500">{customer.account_number}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                {customer.email}
              </a>
            </div>
            {customer.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline">
                  {customer.phone}
                </a>
              </div>
            )}
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-1" />
              <p className="text-sm">{service.installation_address}</p>
            </div>
            <div className="flex items-center gap-3">
              <Package className="w-4 h-4 text-gray-400" />
              <div>
                <p className="font-medium">{service.package_name}</p>
                <Badge variant={service.status === 'active' ? 'default' : 'secondary'}>
                  {service.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Session Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              {diagnostics.is_session_active ? (
                <Wifi className="w-5 h-5 text-green-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium">
                  {diagnostics.is_session_active ? 'Online' : 'Offline'}
                </p>
                {diagnostics.is_session_active && diagnostics.current_session_ip && (
                  <p className="text-sm text-gray-500">IP: {diagnostics.current_session_ip}</p>
                )}
              </div>
            </div>

            {diagnostics.last_session_start && (
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm">Session Started</p>
                  <p className="font-medium">{formatRelativeTime(diagnostics.last_session_start)}</p>
                </div>
              </div>
            )}

            {diagnostics.last_session_duration_seconds > 0 && (
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm">Session Duration</p>
                  <p className="font-medium">{formatDuration(diagnostics.last_session_duration_seconds)}</p>
                </div>
              </div>
            )}

            {diagnostics.last_terminate_cause && (
              <div className="flex items-center gap-3">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <div>
                  <p className="text-sm">Last Disconnect</p>
                  <p className="font-medium text-red-600">{diagnostics.last_terminate_cause}</p>
                  {diagnostics.last_disconnect_time && (
                    <p className="text-xs text-gray-500">
                      {formatRelativeTime(diagnostics.last_disconnect_time)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {diagnostics.nas_ip_address && (
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm">NAS IP</p>
                  <p className="font-mono text-sm">{diagnostics.nas_ip_address}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 7-Day Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">7-Day Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold">{diagnostics.total_sessions_7days}</p>
                <p className="text-sm text-gray-500">Total Sessions</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{diagnostics.lost_carrier_count_7days}</p>
                <p className="text-sm text-gray-500">Connection Drops</p>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-lg font-bold">{formatDuration(diagnostics.total_online_seconds_7days)}</p>
              <p className="text-sm text-gray-500">Total Online Time</p>
            </div>

            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-lg font-bold">{formatDuration(diagnostics.avg_session_duration_seconds)}</p>
              <p className="text-sm text-gray-500">Avg Session Duration</p>
            </div>

            <div className="text-sm text-gray-500">
              <p>Last Check: {formatRelativeTime(diagnostics.last_check_at)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Open Tickets */}
      {open_tickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              Open Tickets ({open_tickets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {open_tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-3 bg-amber-50 rounded-lg cursor-pointer hover:bg-amber-100"
                  onClick={() => router.push(`/admin/support/tickets/${ticket.id}`)}
                >
                  <div>
                    <p className="font-medium">{ticket.ticket_number}</p>
                    <p className="text-sm text-gray-600">{ticket.subject}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{ticket.status}</Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatRelativeTime(ticket.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>Last 50 diagnostic events for this subscriber</CardDescription>
        </CardHeader>
        <CardContent>
          {recent_events.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">No events recorded yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent_events.map((event: SubscriberEvent) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm">{formatRelativeTime(event.created_at)}</p>
                        <p className="text-xs text-gray-400">{formatDate(event.created_at)}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getEventTypeBadge(event.event_type)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{event.event_source}</Badge>
                    </TableCell>
                    <TableCell>{getSeverityBadge(event.severity as Severity)}</TableCell>
                    <TableCell>
                      {event.session_active ? (
                        <Wifi className="w-4 h-4 text-green-500" />
                      ) : (
                        <WifiOff className="w-4 h-4 text-gray-400" />
                      )}
                      {event.session_ip && (
                        <span className="text-xs text-gray-500 ml-1">{event.session_ip}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {event.terminate_cause && (
                        <Badge variant="outline" className="bg-red-50 text-red-700">
                          {event.terminate_cause}
                        </Badge>
                      )}
                      {event.health_impact !== 0 && (
                        <span className={`text-sm ml-2 ${event.health_impact > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {event.health_impact > 0 ? '+' : ''}{event.health_impact}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
