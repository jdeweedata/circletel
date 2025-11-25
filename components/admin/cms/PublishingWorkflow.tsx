'use client';

/**
 * CMS Page Builder - Publishing Workflow Component
 *
 * Handles page status transitions, publishing, scheduling, and archiving.
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Send,
  Calendar,
  Archive,
  Eye,
  EyeOff,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';
import type { PageStatus } from '@/lib/cms/types';

// ============================================
// Types
// ============================================

interface PublishingWorkflowProps {
  pageId: string;
  currentStatus: PageStatus;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  onStatusChange?: (status: PageStatus) => void;
  className?: string;
}

// ============================================
// Status Badge Component
// ============================================

const statusConfig: Record<
  PageStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  draft: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: Eye,
  },
  in_review: {
    label: 'In Review',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: Clock,
  },
  scheduled: {
    label: 'Scheduled',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Calendar,
  },
  published: {
    label: 'Published',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle,
  },
  archived: {
    label: 'Archived',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: Archive,
  },
};

function StatusBadge({ status }: { status: PageStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        config.color
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

// ============================================
// Schedule Modal Component
// ============================================

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (date: string) => void;
  isLoading: boolean;
}

function ScheduleModal({ isOpen, onClose, onSchedule, isLoading }: ScheduleModalProps) {
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');

  if (!isOpen) return null;

  const handleSchedule = () => {
    if (!scheduleDate) return;
    const dateTime = `${scheduleDate}T${scheduleTime}:00`;
    onSchedule(dateTime);
  };

  // Get minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Schedule Publication
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          Choose when this page should be automatically published.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              min={minDate}
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time
            </label>
            <input
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {scheduleDate && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                Page will be published on{' '}
                <strong>
                  {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString()}
                </strong>
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSchedule}
            disabled={!scheduleDate || isLoading}
            className={cn(
              'flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2',
              scheduleDate && !isLoading
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                Schedule
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Publishing Workflow Component
// ============================================

export function PublishingWorkflow({
  pageId,
  currentStatus,
  scheduledAt,
  publishedAt,
  onStatusChange,
  className,
}: PublishingWorkflowProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Handle publish/unpublish/archive actions
  const handleAction = async (action: 'publish' | 'unpublish' | 'archive') => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/cms/pages/${pageId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update page status');
      }

      onStatusChange?.(data.page.status);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle scheduling
  const handleSchedule = async (dateTime: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/cms/pages/${pageId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduled_at: dateTime }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to schedule page');
      }

      onStatusChange?.(data.page.status);
      setShowScheduleModal(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel scheduling
  const handleCancelSchedule = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/cms/pages/${pageId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancel: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel scheduling');
      }

      onStatusChange?.(data.page.status);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Current Status */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Status</span>
        <StatusBadge status={currentStatus} />
      </div>

      {/* Scheduled Info */}
      {currentStatus === 'scheduled' && scheduledAt && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-700">
                Scheduled for publication
              </p>
              <p className="text-sm text-blue-600">
                {new Date(scheduledAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Published Info */}
      {currentStatus === 'published' && publishedAt && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-700">Published</p>
              <p className="text-sm text-green-600">
                {new Date(publishedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        {/* Draft or In Review -> Publish */}
        {(currentStatus === 'draft' || currentStatus === 'in_review') && (
          <>
            <button
              onClick={() => handleAction('publish')}
              disabled={isLoading}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors',
                isLoading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              )}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Publish Now
            </button>

            <button
              onClick={() => setShowScheduleModal(true)}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Schedule
            </button>
          </>
        )}

        {/* Scheduled -> Cancel or Publish Now */}
        {currentStatus === 'scheduled' && (
          <>
            <button
              onClick={() => handleAction('publish')}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Publish Now
            </button>

            <button
              onClick={handleCancelSchedule}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel Schedule
            </button>
          </>
        )}

        {/* Published -> Unpublish */}
        {currentStatus === 'published' && (
          <button
            onClick={() => handleAction('unpublish')}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
            Unpublish
          </button>
        )}

        {/* Archive (available for all non-archived) */}
        {currentStatus !== 'archived' && (
          <button
            onClick={() => handleAction('archive')}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <Archive className="w-4 h-4" />
            Archive
          </button>
        )}

        {/* Archived -> Restore to Draft */}
        {currentStatus === 'archived' && (
          <button
            onClick={() => handleAction('unpublish')}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            Restore to Draft
          </button>
        )}
      </div>

      {/* Schedule Modal */}
      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSchedule={handleSchedule}
        isLoading={isLoading}
      />
    </div>
  );
}

export default PublishingWorkflow;
