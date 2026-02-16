'use client'

import { CheckCircle, AlertTriangle, XCircle, HelpCircle, Wifi } from 'lucide-react'

type ProviderStatus = 'operational' | 'degraded' | 'outage' | 'unknown'

interface ProviderStatusCardProps {
  name: string
  status: ProviderStatus
  latency: number | null
  lastCheck: string | null
}

const statusConfig = {
  operational: {
    icon: CheckCircle,
    label: 'Operational',
    dotColor: 'bg-green-500',
    iconColor: 'text-green-500',
    bgHover: 'hover:bg-green-50',
  },
  degraded: {
    icon: AlertTriangle,
    label: 'Degraded',
    dotColor: 'bg-yellow-500',
    iconColor: 'text-yellow-500',
    bgHover: 'hover:bg-yellow-50',
  },
  outage: {
    icon: XCircle,
    label: 'Outage',
    dotColor: 'bg-red-500',
    iconColor: 'text-red-500',
    bgHover: 'hover:bg-red-50',
  },
  unknown: {
    icon: HelpCircle,
    label: 'Unknown',
    dotColor: 'bg-gray-400',
    iconColor: 'text-gray-400',
    bgHover: 'hover:bg-gray-50',
  },
}

export function ProviderStatusCard({
  name,
  status,
  latency,
  lastCheck,
}: ProviderStatusCardProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  const formatLatency = (ms: number | null) => {
    if (ms === null) return '-'
    if (ms < 100) return `${ms}ms`
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const getLatencyColor = (ms: number | null) => {
    if (ms === null) return 'text-gray-400'
    if (ms < 50) return 'text-green-600'
    if (ms < 100) return 'text-green-500'
    if (ms < 200) return 'text-yellow-500'
    return 'text-orange-500'
  }

  return (
    <div
      className={`bg-white border border-ui-border rounded-lg p-4 transition-colors ${config.bgHover}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wifi className="h-5 w-5 text-gray-400" />
          <span className="font-medium text-ui-text-primary">{name}</span>
        </div>
        <Icon className={`h-5 w-5 ${config.iconColor}`} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${config.dotColor}`}
          />
          <span className="text-sm text-ui-text-muted">{config.label}</span>
        </div>

        {latency !== null && (
          <span className={`text-sm font-mono ${getLatencyColor(latency)}`}>
            {formatLatency(latency)}
          </span>
        )}
      </div>
    </div>
  )
}

export function ProviderStatusGrid({
  providers,
}: {
  providers: ProviderStatusCardProps[]
}) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-ui-text-primary mb-4">
        Provider Status
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {providers.map((provider) => (
          <ProviderStatusCard key={provider.name} {...provider} />
        ))}
      </div>
    </div>
  )
}
