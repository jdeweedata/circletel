'use client';

/**
 * Preview Banner Component
 *
 * Displayed at the top of preview pages to indicate preview mode.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, X, ExternalLink, Edit } from 'lucide-react';
import type { PageStatus } from '@/lib/cms/types';

interface PreviewBannerProps {
  pageId: string;
  pageTitle: string;
  status: PageStatus;
}

const statusLabels: Record<PageStatus, string> = {
  draft: 'Draft',
  in_review: 'In Review',
  scheduled: 'Scheduled',
  published: 'Published',
  archived: 'Archived',
};

const statusColors: Record<PageStatus, string> = {
  draft: 'bg-gray-500',
  in_review: 'bg-yellow-500',
  scheduled: 'bg-blue-500',
  published: 'bg-green-500',
  archived: 'bg-red-500',
};

export default function PreviewBanner({ pageId, pageTitle, status }: PreviewBannerProps) {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);

  const handleExitPreview = async () => {
    setIsExiting(true);
    try {
      await fetch('/api/admin/cms/preview', { method: 'DELETE' });
      router.push(`/admin/cms/pages/${pageId}`);
    } catch (error) {
      console.error('Failed to exit preview:', error);
      setIsExiting(false);
    }
  };

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-gray-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Preview indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-orange-500 rounded-full">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">Preview Mode</span>
            </div>
            <span className="text-sm text-gray-300 hidden sm:inline">
              {pageTitle}
            </span>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[status]}`}
            >
              {statusLabels[status]}
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <a
              href={`/admin/cms/pages/${pageId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">Edit Page</span>
            </a>
            {status === 'published' && (
              <a
                href={`/p/${pageId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">View Live</span>
              </a>
            )}
            <button
              onClick={handleExitPreview}
              disabled={isExiting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isExiting ? 'Exiting...' : 'Exit Preview'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
