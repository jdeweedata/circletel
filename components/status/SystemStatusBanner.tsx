'use client'

import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

type OverallStatus = 'operational' | 'degraded' | 'outage'

interface SystemStatusBannerProps {
  status: OverallStatus
  lastUpdated: string
}

const statusConfig = {
  operational: {
    icon: CheckCircle,
    text: 'All Systems Operational',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    iconColor: 'text-green-600',
  },
  degraded: {
    icon: AlertTriangle,
    text: 'Some Systems Experiencing Issues',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-600',
  },
  outage: {
    icon: XCircle,
    text: 'Major System Outage',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-600',
  },
}

export function SystemStatusBanner({ status, lastUpdated }: SystemStatusBannerProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  const formatLastUpdated = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins === 1) return '1 minute ago'
    if (diffMins < 60) return `${diffMins} minutes ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours === 1) return '1 hour ago'
    if (diffHours < 24) return `${diffHours} hours ago`

    return date.toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div
      className={`${config.bgColor} ${config.borderColor} border rounded-xl p-6 mb-8`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className={`h-8 w-8 ${config.iconColor}`} />
          <div>
            <h1 className={`text-xl font-semibold ${config.textColor}`}>
              {config.text}
            </h1>
            <p className="text-sm text-gray-600 mt-0.5">
              Last updated: {formatLastUpdated(lastUpdated)}
            </p>
          </div>
        </div>
        <div className="hidden sm:block">
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor} border ${config.borderColor}`}
          >
            {status === 'operational' && 'Healthy'}
            {status === 'degraded' && 'Degraded'}
            {status === 'outage' && 'Outage'}
          </div>
        </div>
      </div>
    </div>
  )
}
