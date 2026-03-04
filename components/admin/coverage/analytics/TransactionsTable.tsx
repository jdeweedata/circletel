'use client';

import React from 'react';
import { ChevronRight, Check, X, Clock } from 'lucide-react';

export interface TransactionRecord {
  id: string;
  provider: string;
  timestamp: Date;
  status: 'SUCCESS' | 'FAILED' | 'TIMEOUT';
  responseTime?: number;
  errorMessage?: string;
}

interface TransactionsTableProps {
  transactions: TransactionRecord[];
  onViewAll?: () => void;
  title?: string;
}

function getStatusBadge(status: TransactionRecord['status']) {
  switch (status) {
    case 'SUCCESS':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
          <Check className="h-3 w-3" />
          SUCCESS
        </span>
      );
    case 'FAILED':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
          <X className="h-3 w-3" />
          FAILED
        </span>
      );
    case 'TIMEOUT':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
          <Clock className="h-3 w-3" />
          TIMEOUT
        </span>
      );
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function TransactionsTable({
  transactions,
  onViewAll,
  title = 'Recent Requests',
}: TransactionsTableProps) {
  // Sort by timestamp descending (most recent first)
  const sortedTransactions = [...transactions].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-circleTel-orange hover:text-circleTel-orange-dark font-medium flex items-center gap-1 transition-colors"
          >
            View All
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Request ID
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Provider
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Latency
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sortedTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">
                  No recent requests
                </td>
              </tr>
            ) : (
              sortedTransactions.slice(0, 10).map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3">
                    <span className="text-sm font-mono text-gray-600">
                      {tx.id.slice(0, 12)}...
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm font-medium text-gray-900">
                      {tx.provider}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-gray-500">{formatTime(tx.timestamp)}</span>
                  </td>
                  <td className="px-5 py-3">{getStatusBadge(tx.status)}</td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-sm font-medium text-gray-900 tabular-nums">
                      {tx.responseTime !== undefined ? `${tx.responseTime}ms` : '--'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
