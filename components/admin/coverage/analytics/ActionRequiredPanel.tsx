'use client';
import { PiCaretRightBold, PiClockBold, PiInfoBold, PiWarningBold, PiWarningCircleBold } from 'react-icons/pi';

import React from 'react';

export interface ActionItem {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: Date;
}

interface ActionRequiredPanelProps {
  items: ActionItem[];
  onViewAll?: () => void;
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getIcon(type: ActionItem['type']) {
  switch (type) {
    case 'error':
      return <PiWarningCircleBold className="h-4 w-4 text-red-500" />;
    case 'warning':
      return <PiWarningBold className="h-4 w-4 text-amber-500" />;
    case 'info':
      return <PiInfoBold className="h-4 w-4 text-blue-500" />;
  }
}

function getBgColor(type: ActionItem['type']) {
  switch (type) {
    case 'error':
      return 'bg-red-50';
    case 'warning':
      return 'bg-amber-50';
    case 'info':
      return 'bg-blue-50';
  }
}

export function ActionRequiredPanel({ items, onViewAll }: ActionRequiredPanelProps) {
  const sortedItems = [...items].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PiWarningBold className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold text-gray-900">Action Required</h3>
          {items.length > 0 && (
            <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          )}
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto">
        {sortedItems.length === 0 ? (
          <div className="p-5 text-center text-gray-400">
            <p className="text-sm">No actions required</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {sortedItems.slice(0, 5).map((item) => (
              <li
                key={item.id}
                className={`px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${getBgColor(
                  item.type
                )} bg-opacity-30`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getIcon(item.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                      {item.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 whitespace-nowrap">
                    <PiClockBold className="h-3 w-3" />
                    {getRelativeTime(item.timestamp)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      {onViewAll && items.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-100">
          <button
            onClick={onViewAll}
            className="text-sm text-circleTel-orange hover:text-circleTel-orange-dark font-medium flex items-center gap-1 transition-colors"
          >
            View all alerts
            <PiCaretRightBold className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
