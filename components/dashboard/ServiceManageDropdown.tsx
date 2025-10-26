'use client';

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  BarChart3,
  TrendingUp,
  TrendingDown,
  XCircle,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

interface ServiceManageDropdownProps {
  serviceId: string;
  packageName: string;
  className?: string;
}

/**
 * ServiceManageDropdown Component
 *
 * Provides quick access to common service management actions.
 * Inspired by Supersonic's efficient service management UX.
 *
 * Features:
 * - 6 service management actions in 1 dropdown
 * - Color-coded icons for visual distinction
 * - Reduces navigation clicks from 2-3 to 1
 * - Mobile-friendly dropdown menu
 *
 * Actions:
 * 1. View Usage - See data usage and speed test history
 * 2. Upgrade Package - Upgrade to higher speed/features
 * 3. Downgrade Package - Downgrade to lower tier
 * 4. Cancel Service - Service cancellation flow
 * 5. Relocate Service - Move service to new address
 * 6. Log Issue - Create support ticket for service
 *
 * @example
 * ```tsx
 * <ServiceManageDropdown
 *   serviceId="abc-123"
 *   packageName="Fibre 100Mbps Uncapped"
 * />
 * ```
 */
export function ServiceManageDropdown({
  serviceId,
  packageName,
  className,
}: ServiceManageDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`border-circleTel-orange text-circleTel-orange hover:bg-orange-50 hover:text-circleTel-orange font-semibold ${className}`}
        >
          Manage
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* View Usage */}
        <DropdownMenuItem asChild>
          <Link
            href={`/dashboard/usage?service=${serviceId}`}
            className="cursor-pointer flex items-center"
          >
            <BarChart3 className="mr-2 h-4 w-4 text-blue-600" />
            <span>View Usage</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Upgrade Package */}
        <DropdownMenuItem asChild>
          <Link
            href={`/dashboard/services/upgrade?service=${serviceId}`}
            className="cursor-pointer flex items-center"
          >
            <TrendingUp className="mr-2 h-4 w-4 text-green-600" />
            <span>Upgrade Package</span>
          </Link>
        </DropdownMenuItem>

        {/* Downgrade Package */}
        <DropdownMenuItem asChild>
          <Link
            href={`/dashboard/services/downgrade?service=${serviceId}`}
            className="cursor-pointer flex items-center"
          >
            <TrendingDown className="mr-2 h-4 w-4 text-yellow-600" />
            <span>Downgrade Package</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Cancel Service */}
        <DropdownMenuItem asChild>
          <Link
            href={`/dashboard/services/cancel?service=${serviceId}`}
            className="cursor-pointer flex items-center"
          >
            <XCircle className="mr-2 h-4 w-4 text-red-600" />
            <span>Cancel Service</span>
          </Link>
        </DropdownMenuItem>

        {/* Relocate Service */}
        <DropdownMenuItem asChild>
          <Link
            href={`/dashboard/services/relocate?service=${serviceId}`}
            className="cursor-pointer flex items-center"
          >
            <MapPin className="mr-2 h-4 w-4 text-purple-600" />
            <span>Relocate Service</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Log Issue */}
        <DropdownMenuItem asChild>
          <Link
            href={`/dashboard/tickets/new?service=${serviceId}&package=${encodeURIComponent(packageName)}`}
            className="cursor-pointer flex items-center"
          >
            <AlertCircle className="mr-2 h-4 w-4 text-orange-600" />
            <span>Log Issue</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
