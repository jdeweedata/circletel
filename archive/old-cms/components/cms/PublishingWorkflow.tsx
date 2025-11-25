'use client';

/**
 * Publishing Workflow Component
 *
 * Visual status flow with transition controls
 * Features:
 * - Status indicator with progress
 * - One-click status transitions
 * - Scheduled publishing
 * - Workflow history
 * - Permission checks
 */

import React, { useState } from 'react';
import {
  FileText,
  Eye,
  Clock,
  CheckCircle,
  Archive,
  Calendar,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type PageStatus = 'draft' | 'in_review' | 'scheduled' | 'published' | 'archived';

interface WorkflowTransition {
  from: PageStatus;
  to: PageStatus;
  label: string;
  icon: React.ReactNode;
  color: string;
  requiresDate?: boolean;
}

interface PublishingWorkflowProps {
  currentStatus: PageStatus;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  onStatusChange: (newStatus: PageStatus, scheduledAt?: string) => Promise<void>;
  canPublish?: boolean;
  canArchive?: boolean;
  isUpdating?: boolean;
}

const TRANSITIONS: WorkflowTransition[] = [
  {
    from: 'draft',
    to: 'in_review',
    label: 'Submit for Review',
    icon: <Eye className="w-4 h-4" />,
    color: 'yellow',
  },
  {
    from: 'draft',
    to: 'scheduled',
    label: 'Schedule Publish',
    icon: <Clock className="w-4 h-4" />,
    color: 'blue',
    requiresDate: true,
  },
  {
    from: 'draft',
    to: 'published',
    label: 'Publish Now',
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'green',
  },
  {
    from: 'in_review',
    to: 'draft',
    label: 'Back to Draft',
    icon: <FileText className="w-4 h-4" />,
    color: 'gray',
  },
  {
    from: 'in_review',
    to: 'published',
    label: 'Approve & Publish',
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'green',
  },
  {
    from: 'in_review',
    to: 'scheduled',
    label: 'Approve & Schedule',
    icon: <Clock className="w-4 h-4" />,
    color: 'blue',
    requiresDate: true,
  },
  {
    from: 'scheduled',
    to: 'draft',
    label: 'Cancel Schedule',
    icon: <FileText className="w-4 h-4" />,
    color: 'gray',
  },
  {
    from: 'scheduled',
    to: 'published',
    label: 'Publish Now',
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'green',
  },
  {
    from: 'published',
    to: 'draft',
    label: 'Unpublish',
    icon: <FileText className="w-4 h-4" />,
    color: 'gray',
  },
  {
    from: 'published',
    to: 'archived',
    label: 'Archive',
    icon: <Archive className="w-4 h-4" />,
    color: 'red',
  },
  {
    from: 'archived',
    to: 'draft',
    label: 'Restore to Draft',
    icon: <FileText className="w-4 h-4" />,
    color: 'gray',
  },
];

const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    icon: <FileText className="w-5 h-5" />,
    color: 'bg-gray-100 text-gray-800',
    borderColor: 'border-gray-300',
    description: 'Page is being created or edited',
  },
  in_review: {
    label: 'In Review',
    icon: <Eye className="w-5 h-5" />,
    color: 'bg-yellow-100 text-yellow-800',
    borderColor: 'border-yellow-300',
    description: 'Waiting for approval',
  },
  scheduled: {
    label: 'Scheduled',
    icon: <Clock className="w-5 h-5" />,
    color: 'bg-blue-100 text-blue-800',
    borderColor: 'border-blue-300',
    description: 'Will be published automatically',
  },
  published: {
    label: 'Published',
    icon: <CheckCircle className="w-5 h-5" />,
    color: 'bg-green-100 text-green-800',
    borderColor: 'border-green-300',
    description: 'Live on website',
  },
  archived: {
    label: 'Archived',
    icon: <Archive className="w-5 h-5" />,
    color: 'bg-red-100 text-red-800',
    borderColor: 'border-red-300',
    description: 'No longer visible',
  },
};

export default function PublishingWorkflow({
  currentStatus,
  scheduledAt,
  publishedAt,
  onStatusChange,
  canPublish = true,
  canArchive = true,
  isUpdating = false,
}: PublishingWorkflowProps) {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // Get available transitions for current status
  const availableTransitions = TRANSITIONS.filter(t => t.from === currentStatus);

  const handleTransition = async (transition: WorkflowTransition) => {
    if (transition.requiresDate) {
      setShowScheduleModal(true);
      return;
    }

    // Check permissions
    if (transition.to === 'published' && !canPublish) {
      alert('You do not have permission to publish pages');
      return;
    }

    if (transition.to === 'archived' && !canArchive) {
      alert('You do not have permission to archive pages');
      return;
    }

    await onStatusChange(transition.to);
  };

  const handleScheduleSubmit = async () => {
    if (!scheduleDate || !scheduleTime) {
      alert('Please select both date and time');
      return;
    }

    const scheduledDateTime = `${scheduleDate}T${scheduleTime}:00`;
    const scheduledTimestamp = new Date(scheduledDateTime).toISOString();

    // Check if date is in the future
    if (new Date(scheduledTimestamp) <= new Date()) {
      alert('Scheduled date must be in the future');
      return;
    }

    await onStatusChange('scheduled', scheduledTimestamp);
    setShowScheduleModal(false);
    setScheduleDate('');
    setScheduleTime('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const currentConfig = STATUS_CONFIG[currentStatus];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Publishing Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="space-y-3">
          <div className={`flex items-center gap-3 p-4 rounded-lg border-2 ${currentConfig.borderColor} ${currentConfig.color}`}>
            {currentConfig.icon}
            <div className="flex-1">
              <p className="font-semibold">{currentConfig.label}</p>
              <p className="text-sm opacity-75">{currentConfig.description}</p>
            </div>
          </div>

          {/* Scheduled Date Info */}
          {currentStatus === 'scheduled' && scheduledAt && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <Calendar className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900">Scheduled for:</p>
                <p className="text-blue-700">{formatDate(scheduledAt)}</p>
              </div>
            </div>
          )}

          {/* Published Date Info */}
          {currentStatus === 'published' && publishedAt && (
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Published on:</p>
                <p className="text-green-700">{formatDate(publishedAt)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Available Actions */}
        {availableTransitions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">Available Actions</h4>
            <div className="space-y-2">
              {availableTransitions.map((transition, index) => {
                // Check if action is disabled due to permissions
                const isDisabled =
                  isUpdating ||
                  (transition.to === 'published' && !canPublish) ||
                  (transition.to === 'archived' && !canArchive);

                return (
                  <button
                    key={index}
                    onClick={() => handleTransition(transition)}
                    disabled={isDisabled}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                      isDisabled
                        ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                        : `bg-white border-${transition.color}-300 hover:bg-${transition.color}-50 hover:border-${transition.color}-400`
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {transition.icon}
                      <span className="font-medium">{transition.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Permission Warnings */}
        {(!canPublish || !canArchive) && (
          <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-900">Limited Permissions</p>
              <p className="text-orange-700">
                {!canPublish && 'You cannot publish pages. '}
                {!canArchive && 'You cannot archive pages. '}
                Contact an administrator for access.
              </p>
            </div>
          </div>
        )}

        {/* Schedule Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold mb-4">Schedule Publishing</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <p className="text-blue-900">
                    <strong>Note:</strong> The page will be automatically published at the selected date and time.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScheduleSubmit}
                  className="flex-1 px-4 py-2 bg-circleTel-orange text-white rounded-lg font-semibold hover:bg-orange-600"
                >
                  Schedule
                </button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
