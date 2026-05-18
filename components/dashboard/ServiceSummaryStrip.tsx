'use client';

import React from 'react';
import Link from 'next/link';
import { PiPackageBold, PiArrowDownBold, PiArrowUpBold } from 'react-icons/pi';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ServiceSummaryStripProps {
  services: Array<{
    id: string;
    package_name: string;
    service_type: string;
    status: string;
    monthly_price: number;
    installation_address: string;
    speed_down: number;
    speed_up: number;
  }>;
  billing: {
    account_balance: number;
    next_billing_date: string;
  } | null;
  className?: string;
}

export function ServiceSummaryStrip({
  services,
  billing,
  className,
}: ServiceSummaryStripProps) {
  // Empty state: no active services
  if (services.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8 text-center', className)}>
        <PiPackageBold className="h-12 w-12 text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium mb-3">No active services</p>
        <Link
          href="/"
          className="text-circleTel-orange hover:text-circleTel-orange-dark font-medium text-sm"
        >
          Check Coverage &amp; Order
        </Link>
      </div>
    );
  }

  const primaryService = services[0];
  const additionalCount = services.length - 1;

  // Format billing date
  const formatBillingDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <Card
      className={cn(
        'border border-gray-200 bg-white shadow-sm overflow-hidden',
        className
      )}
    >
      <div className="p-4 md:p-6">
        {/* Main service content - responsive layout */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
          {/* Left: Package name with status */}
          <div className="flex items-center gap-3">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">
                {primaryService.package_name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-xs font-medium text-green-600">Active</span>
              </div>
            </div>
          </div>

          {/* Middle: Speed metrics */}
          <div className="flex items-center gap-4 text-gray-900 font-medium text-sm md:text-base">
            <div className="flex items-center gap-1">
              <PiArrowDownBold className="h-4 w-4 text-gray-600" />
              <span>{primaryService.speed_down} Mbps</span>
            </div>
            <div className="flex items-center gap-1">
              <PiArrowUpBold className="h-4 w-4 text-gray-600" />
              <span>{primaryService.speed_up} Mbps</span>
            </div>
          </div>

          {/* Right: Price + Additional services */}
          <div className="flex items-center gap-6 justify-between md:justify-start">
            <div className="text-right md:text-left">
              <p className="font-bold text-gray-900 text-lg">
                R{primaryService.monthly_price}/mo
              </p>
            </div>

            {/* Multiple services indicator */}
            {additionalCount > 0 && (
              <Link
                href="/dashboard/services"
                className="text-circleTel-orange hover:text-circleTel-orange-dark font-medium text-sm whitespace-nowrap"
              >
                +{additionalCount} more
              </Link>
            )}
          </div>
        </div>

        {/* Billing info - full width line below */}
        {billing && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 text-xs md:text-sm">
              <div className="text-gray-600">
                <span className="font-medium">Balance: </span>
                <span className="text-gray-900 font-semibold">
                  R{Math.abs(billing.account_balance).toFixed(2)}
                </span>
                {billing.account_balance < 0 && (
                  <span className="text-red-600 ml-1">(credit)</span>
                )}
              </div>
              <div className="text-gray-600">
                <span className="font-medium">Next billing: </span>
                <span className="text-gray-900 font-semibold">
                  {formatBillingDate(billing.next_billing_date)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* View all services link - appears only for multi-service */}
        {additionalCount > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link
              href="/dashboard/services"
              className="inline-flex items-center gap-1 text-circleTel-orange hover:text-circleTel-orange-dark font-medium text-sm transition-colors"
            >
              View all services
              <span>→</span>
            </Link>
          </div>
        )}
      </div>
    </Card>
  );
}
