'use client';
import { PiTrendDownBold, PiTrendUpBold } from 'react-icons/pi';

import React from 'react';

interface KonnecktStatCardProps {
  label: string;
  value: string | number;
  trend?: { value: number; isPositive: boolean };
  subtext?: string;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
}

export function KonnecktStatCard({
  label,
  value,
  trend,
  subtext,
  prefix,
  suffix,
  icon,
}: KonnecktStatCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      {/* Header row with label and optional icon */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>

      {/* Value row with trend badge */}
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-bold text-gray-900">
          {prefix}
          {typeof value === 'number' ? value.toLocaleString() : value}
          {suffix}
        </span>

        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 text-sm font-medium ${
              trend.isPositive ? 'text-emerald-600' : 'text-red-500'
            }`}
          >
            {trend.isPositive ? (
              <PiTrendUpBold className="h-3.5 w-3.5" />
            ) : (
              <PiTrendDownBold className="h-3.5 w-3.5" />
            )}
            {trend.isPositive ? '+' : '-'}
            {Math.abs(trend.value).toFixed(1)}%
          </span>
        )}
      </div>

      {/* Subtext */}
      {subtext && (
        <p className="text-xs text-gray-400 mt-2">{subtext}</p>
      )}
    </div>
  );
}
