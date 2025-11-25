'use client';

/**
 * CMS Page Builder - Version History Component
 *
 * Displays page version history and allows restoring previous versions.
 */

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  History,
  RotateCcw,
  Eye,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react';
import type { ContentBlock } from '@/lib/cms/types';

// ============================================
// Types
// ============================================

interface PageVersion {
  id: string;
  page_id: string;
  version: number;
  content: {
    blocks: ContentBlock[];
  };
  seo_metadata?: Record<string, unknown>;
  change_summary?: string;
  created_by?: string;
  created_at: string;
  admin_users?: {
    email?: string;
    full_name?: string;
  };
}

interface VersionHistoryProps {
  pageId: string;
  currentVersion: number;
  onRestore?: (content: { blocks: ContentBlock[] }) => void;
  className?: string;
}

// ============================================
// Version Preview Modal
// ============================================

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  version: PageVersion | null;
  onRestore: () => void;
  isRestoring: boolean;
}

function PreviewModal({
  isOpen,
  onClose,
  version,
  onRestore,
  isRestoring,
}: PreviewModalProps) {
  if (!isOpen || !version) return null;

  const blocks = version.content?.blocks || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Version {version.version} Preview
            </h2>
            <p className="text-sm text-gray-500">
              {new Date(version.created_at).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Preview */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Blocks:</span>
              <span>{blocks.length}</span>
            </div>

            {/* Block List */}
            <div className="space-y-3">
              {blocks.map((block, index) => (
                <div
                  key={block.id || index}
                  className="p-4 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-500">
                      #{index + 1}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-200 rounded text-xs font-medium capitalize">
                      {block.type}
                    </span>
                  </div>
                  <pre className="text-xs text-gray-600 overflow-auto max-h-32">
                    {JSON.stringify(block.content, null, 2)}
                  </pre>
                </div>
              ))}

              {blocks.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">
                  No blocks in this version
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
          <button
            onClick={onRestore}
            disabled={isRestoring}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
              isRestoring
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-orange-500 text-white hover:bg-orange-600'
            )}
          >
            {isRestoring ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Restoring...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                Restore This Version
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Version History Component
// ============================================

export function VersionHistory({
  pageId,
  currentVersion,
  onRestore,
  className,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<PageVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<PageVersion | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  // Fetch version history
  const fetchVersions = useCallback(async () => {
    if (!pageId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/cms/pages/${pageId}/versions`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch versions');
      }

      setVersions(data.versions || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    if (isExpanded) {
      fetchVersions();
    }
  }, [isExpanded, fetchVersions]);

  // Handle restore
  const handleRestore = async (version: PageVersion) => {
    setIsRestoring(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/cms/pages/${pageId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: version.version }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to restore version');
      }

      // Callback with restored content
      if (onRestore && version.content) {
        onRestore(version.content);
      }

      setRestoreSuccess(true);
      setSelectedVersion(null);

      // Refresh versions list
      await fetchVersions();

      // Clear success message after 3 seconds
      setTimeout(() => setRestoreSuccess(false), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {/* Header - Collapsible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-900">Version History</span>
          <span className="text-sm text-gray-500">v{currentVersion}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Success Message */}
          {restoreSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-sm text-green-700">
                Version restored successfully!
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && versions.length === 0 && (
            <div className="text-center py-8">
              <History className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No version history yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Versions are created when you save changes
              </p>
            </div>
          )}

          {/* Version List */}
          {!isLoading && versions.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between p-3 bg-white border rounded-lg hover:border-orange-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">
                        v{version.version}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {version.change_summary || 'Content updated'}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(version.created_at).toLocaleString()}
                        </span>
                        {version.admin_users?.full_name && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {version.admin_users.full_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedVersion(version)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRestore(version)}
                      disabled={isRestoring}
                      className="p-2 text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Restore"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info */}
          <p className="text-xs text-gray-400 text-center">
            Click restore to revert to a previous version
          </p>
        </div>
      )}

      {/* Preview Modal */}
      <PreviewModal
        isOpen={!!selectedVersion}
        onClose={() => setSelectedVersion(null)}
        version={selectedVersion}
        onRestore={() => selectedVersion && handleRestore(selectedVersion)}
        isRestoring={isRestoring}
      />
    </div>
  );
}

export default VersionHistory;
