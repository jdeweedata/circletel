'use client';

/**
 * CMS Page Builder - Main Builder Page
 *
 * Full-screen page builder with drag-and-drop canvas.
 * Route: /admin/cms/builder?id=xxx (edit) or /admin/cms/builder (new)
 */

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DndContext, DragEndEvent, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { usePageBuilderStore } from '@/lib/cms/store';
import { BuilderHeader } from '@/components/admin/cms/BuilderHeader';
import { BlockPalette } from '@/components/admin/cms/BlockPalette';
import { BuilderCanvas } from '@/components/admin/cms/BuilderCanvas';
import { PropertiesPanel } from '@/components/admin/cms/PropertiesPanel';
import { TemplateSelector } from '@/components/admin/cms/TemplateSelector';
import type { CMSTemplate, BlockType } from '@/lib/cms/types';
import { cn } from '@/lib/utils';
import { Loader2, PanelLeft, PanelRight } from 'lucide-react';

export default function PageBuilderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pageId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  const initPage = usePageBuilderStore((state) => state.initPage);
  const loadTemplate = usePageBuilderStore((state) => state.loadTemplate);
  const addBlock = usePageBuilderStore((state) => state.addBlock);
  const reset = usePageBuilderStore((state) => state.reset);
  const isPreviewing = usePageBuilderStore((state) => state.isPreviewing);

  // Load page or show template selector
  useEffect(() => {
    const loadPage = async () => {
      if (pageId) {
        // Editing existing page
        try {
          setLoading(true);
          const response = await fetch(`/api/admin/cms/pages/${pageId}`);
          if (!response.ok) {
            throw new Error('Failed to load page');
          }
          const data = await response.json();
          initPage(data.page);
        } catch (err) {
          console.error('Failed to load page:', err);
          setError('Failed to load page. Please try again.');
        } finally {
          setLoading(false);
        }
      } else {
        // New page - show template selector
        reset();
        setShowTemplateSelector(true);
        setLoading(false);
      }
    };

    loadPage();
  }, [pageId, initPage, reset]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        usePageBuilderStore.getState().savePage();
      }
      // Ctrl/Cmd + Z to undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        usePageBuilderStore.getState().undo();
      }
      // Ctrl/Cmd + Shift + Z to redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        usePageBuilderStore.getState().redo();
      }
      // Escape to deselect block
      if (e.key === 'Escape') {
        usePageBuilderStore.getState().selectBlock(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle template selection
  const handleTemplateSelect = useCallback(
    (template: CMSTemplate | null) => {
      if (template) {
        loadTemplate(template);
      } else {
        initPage();
      }
      setShowTemplateSelector(false);
    },
    [loadTemplate, initPage]
  );

  // Handle drag from palette to canvas
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      // Check if dragging from palette
      if (active.data.current?.fromPalette && active.data.current?.type) {
        const blockType = active.data.current.type as BlockType;
        addBlock(blockType);
      }
    },
    [addBlock]
  );

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading page builder...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.push('/admin/cms')}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Back to CMS
          </button>
        </div>
      </div>
    );
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
        {/* Header */}
        <BuilderHeader />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Block Palette */}
          {!isPreviewing && (
            <div
              className={cn(
                'bg-white border-r transition-all duration-300 flex flex-col',
                leftPanelOpen ? 'w-64' : 'w-12'
              )}
            >
              {/* Toggle Button */}
              <button
                onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                className="p-3 border-b hover:bg-gray-50 transition-colors"
                title={leftPanelOpen ? 'Collapse' : 'Expand'}
              >
                <PanelLeft
                  className={cn(
                    'w-5 h-5 text-gray-500 transition-transform',
                    !leftPanelOpen && 'rotate-180'
                  )}
                />
              </button>

              {/* Panel Content */}
              {leftPanelOpen && (
                <div className="flex-1 overflow-y-auto">
                  <BlockPalette />
                </div>
              )}
            </div>
          )}

          {/* Canvas */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto py-6">
              <BuilderCanvas />
            </div>
          </div>

          {/* Right Sidebar - Properties Panel */}
          {!isPreviewing && (
            <div
              className={cn(
                'bg-white border-l transition-all duration-300 flex flex-col',
                rightPanelOpen ? 'w-80' : 'w-12'
              )}
            >
              {/* Toggle Button */}
              <button
                onClick={() => setRightPanelOpen(!rightPanelOpen)}
                className="p-3 border-b hover:bg-gray-50 transition-colors"
                title={rightPanelOpen ? 'Collapse' : 'Expand'}
              >
                <PanelRight
                  className={cn(
                    'w-5 h-5 text-gray-500 transition-transform',
                    !rightPanelOpen && 'rotate-180'
                  )}
                />
              </button>

              {/* Panel Content */}
              {rightPanelOpen && (
                <div className="flex-1 overflow-hidden">
                  <PropertiesPanel className="h-full" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Template Selector Modal */}
        <TemplateSelector
          isOpen={showTemplateSelector}
          onClose={() => {
            if (!pageId) {
              router.push('/admin/cms');
            }
            setShowTemplateSelector(false);
          }}
          onSelect={handleTemplateSelect}
        />
      </div>
    </DndContext>
  );
}
