'use client';

/**
 * CMS Page Builder - Header Component
 *
 * Header with page info, save/preview/publish actions, and undo/redo.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePageBuilderStore, selectCanUndo, selectCanRedo } from '@/lib/cms/store';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Globe,
  Undo2,
  Redo2,
  ExternalLink,
  FileText,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';

interface BuilderHeaderProps {
  className?: string;
}

export function BuilderHeader({ className }: BuilderHeaderProps) {
  const router = useRouter();
  const currentPage = usePageBuilderStore((state) => state.currentPage);
  const isDirty = usePageBuilderStore((state) => state.isDirty);
  const isSaving = usePageBuilderStore((state) => state.isSaving);
  const isPreviewing = usePageBuilderStore((state) => state.isPreviewing);
  const canUndo = usePageBuilderStore(selectCanUndo);
  const canRedo = usePageBuilderStore(selectCanRedo);

  const setPreviewMode = usePageBuilderStore((state) => state.setPreviewMode);
  const savePage = usePageBuilderStore((state) => state.savePage);
  const publishPage = usePageBuilderStore((state) => state.publishPage);
  const undo = usePageBuilderStore((state) => state.undo);
  const redo = usePageBuilderStore((state) => state.redo);

  const [isPublishing, setIsPublishing] = useState(false);
  const [isOpeningPreview, setIsOpeningPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const handleSave = async () => {
    try {
      setSaveStatus('saving');
      await savePage();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handlePublish = async () => {
    if (!confirm('Are you sure you want to publish this page? It will be visible to visitors.')) {
      return;
    }

    try {
      setIsPublishing(true);
      await publishPage();
    } catch (error) {
      console.error('Failed to publish:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleBack = () => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
        return;
      }
    }
    router.push('/admin/cms');
  };

  const handleOpenPreview = async () => {
    if (!currentPage?.id) return;

    try {
      setIsOpeningPreview(true);

      // Save first if dirty
      if (isDirty) {
        await savePage();
      }

      // Generate preview token
      const response = await fetch('/api/admin/cms/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: currentPage.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate preview');
      }

      const data = await response.json();

      // Open preview in new tab
      window.open(data.previewUrl, '_blank');
    } catch (error) {
      console.error('Failed to open preview:', error);
      alert('Failed to open preview. Please try again.');
    } finally {
      setIsOpeningPreview(false);
    }
  };

  const getStatusBadge = () => {
    if (!currentPage?.status) return null;

    const statusStyles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      published: 'bg-green-100 text-green-700',
      archived: 'bg-red-100 text-red-700',
    };

    return (
      <span
        className={cn(
          'px-2 py-0.5 text-xs font-medium rounded-full capitalize',
          statusStyles[currentPage.status] || statusStyles.draft
        )}
      >
        {currentPage.status}
      </span>
    );
  };

  return (
    <header
      className={cn(
        'h-14 bg-white border-b flex items-center justify-between px-4',
        className
      )}
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Back to CMS"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>

        <div className="h-6 w-px bg-gray-200" />

        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-orange-500" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
              {currentPage?.title || 'Untitled Page'}
            </span>
            <span className="text-xs text-gray-500">
              /{currentPage?.slug || 'new-page'}
            </span>
          </div>
          {getStatusBadge()}
          {isDirty && (
            <span className="text-xs text-orange-500 font-medium">Unsaved</span>
          )}
        </div>
      </div>

      {/* Center Section - Undo/Redo */}
      <div className="flex items-center gap-1">
        <button
          onClick={undo}
          disabled={!canUndo}
          className={cn(
            'p-2 rounded-lg transition-colors',
            canUndo
              ? 'hover:bg-gray-100 text-gray-600'
              : 'text-gray-300 cursor-not-allowed'
          )}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className={cn(
            'p-2 rounded-lg transition-colors',
            canRedo
              ? 'hover:bg-gray-100 text-gray-600'
              : 'text-gray-300 cursor-not-allowed'
          )}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Save Status Indicator */}
        {saveStatus === 'saving' && (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            Saving...
          </span>
        )}
        {saveStatus === 'saved' && (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <Check className="w-3 h-3" />
            Saved
          </span>
        )}
        {saveStatus === 'error' && (
          <span className="flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="w-3 h-3" />
            Failed to save
          </span>
        )}

        {/* Preview Toggle */}
        <button
          onClick={() => setPreviewMode(!isPreviewing)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            isPreviewing
              ? 'bg-orange-100 text-orange-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          {isPreviewing ? (
            <>
              <EyeOff className="w-4 h-4" />
              Exit Preview
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              Preview
            </>
          )}
        </button>

        {/* Preview in New Tab */}
        {currentPage?.id && (
          <button
            onClick={handleOpenPreview}
            disabled={isOpeningPreview}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            title="Open preview in new tab"
          >
            {isOpeningPreview ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            isDirty
              ? 'bg-gray-900 text-white hover:bg-gray-800'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          )}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save
        </button>

        {/* Publish Button */}
        <button
          onClick={handlePublish}
          disabled={isPublishing || isDirty}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            !isDirty && currentPage?.status !== 'published'
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          )}
          title={isDirty ? 'Save changes first' : 'Publish page'}
        >
          {isPublishing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Globe className="w-4 h-4" />
          )}
          Publish
        </button>
      </div>
    </header>
  );
}

export default BuilderHeader;
