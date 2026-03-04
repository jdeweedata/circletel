'use client';
import { PiFolderOpenBold, PiWarningBold } from 'react-icons/pi';

import React from 'react';

export interface AtRiskProvider {
  name: string;
  errorRate: number;
  lastError?: string;
  requestCount: number;
}

export interface ErrorCollection {
  type: string;
  count: number;
  trend?: 'up' | 'down' | 'stable';
}

interface AtRiskSectionProps {
  providers: AtRiskProvider[];
  errorCollections: ErrorCollection[];
}

function getRiskLevel(errorRate: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (errorRate >= 20) {
    return { label: 'High', color: 'text-red-700', bgColor: 'bg-red-100' };
  }
  if (errorRate >= 10) {
    return { label: 'Medium', color: 'text-amber-700', bgColor: 'bg-amber-100' };
  }
  return { label: 'Low', color: 'text-emerald-700', bgColor: 'bg-emerald-100' };
}

export function AtRiskSection({ providers, errorCollections }: AtRiskSectionProps) {
  // Sort providers by error rate descending
  const sortedProviders = [...providers].sort((a, b) => b.errorRate - a.errorRate);
  // Sort error collections by count descending
  const sortedErrors = [...errorCollections].sort((a, b) => b.count - a.count);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* At Risk Providers */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <PiWarningBold className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold text-gray-900">At Risk Providers</h3>
        </div>
        <div className="p-5">
          {sortedProviders.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              All providers healthy
            </p>
          ) : (
            <ul className="space-y-3">
              {sortedProviders.slice(0, 5).map((provider) => {
                const risk = getRiskLevel(provider.errorRate);
                return (
                  <li
                    key={provider.name}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {provider.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {provider.requestCount.toLocaleString()} requests
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">
                        {provider.errorRate.toFixed(1)}% errors
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${risk.bgColor} ${risk.color}`}
                      >
                        {risk.label}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Error Collections */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <PiFolderOpenBold className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900">Error Collections</h3>
        </div>
        <div className="p-5">
          {sortedErrors.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No errors recorded</p>
          ) : (
            <ul className="space-y-3">
              {sortedErrors.slice(0, 6).map((error, index) => (
                <li
                  key={error.type}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-400 w-5">
                      {index + 1}.
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {error.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    {error.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
