'use client'
import { PiProhibitBold, PiWifiHighBold, PiWifiSlashBold } from 'react-icons/pi';

import { cn } from '@/lib/utils'

interface SubscriberStatusBadgeProps {
  status: 'online' | 'offline' | 'disabled'
  showIcon?: boolean
  className?: string
}

export function SubscriberStatusBadge({
  status,
  showIcon = true,
  className,
}: SubscriberStatusBadgeProps) {
  const statusConfig = {
    online: {
      label: 'Online',
      icon: PiWifiHighBold,
      bgColor: 'bg-emerald-500',
      textColor: 'text-white',
    },
    offline: {
      label: 'Offline',
      icon: PiWifiSlashBold,
      bgColor: 'bg-slate-400',
      textColor: 'text-white',
    },
    disabled: {
      label: 'Disabled',
      icon: PiProhibitBold,
      bgColor: 'bg-red-500',
      textColor: 'text-white',
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md',
        config.bgColor,
        config.textColor,
        className
      )}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
      {config.label}
    </span>
  )
}
