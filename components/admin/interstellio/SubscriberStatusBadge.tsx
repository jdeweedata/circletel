'use client'
import { PiProhibitBold, PiWifiHighBold, PiWifiSlashBold } from 'react-icons/pi';

import { Badge } from '@/components/ui/badge'
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
      variant: 'default' as const,
      className: 'bg-green-500 hover:bg-green-600 text-white',
    },
    offline: {
      label: 'Offline',
      icon: PiWifiSlashBold,
      variant: 'secondary' as const,
      className: 'bg-gray-400 hover:bg-gray-500 text-white',
    },
    disabled: {
      label: 'Disabled',
      icon: PiProhibitBold,
      variant: 'destructive' as const,
      className: 'bg-red-500 hover:bg-red-600 text-white',
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  )
}
