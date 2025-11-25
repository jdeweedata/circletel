'use client';

/**
 * CMS Page Builder - Builder Canvas
 *
 * The main drag-and-drop canvas where blocks are arranged.
 */

import { useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { usePageBuilderStore, selectSelectedBlock } from '@/lib/cms/store';
import { BLOCK_DEFINITIONS } from '@/lib/cms/block-registry';
import type { ContentBlock, BlockType } from '@/lib/cms/types';
import { Plus, GripVertical, Trash2, Copy, Settings } from 'lucide-react';
import { useState } from 'react';

// ============================================
// Sortable Block Wrapper
// ============================================

interface SortableBlockProps {
  block: ContentBlock;
  children: React.ReactNode;
}

function SortableBlock({ block, children }: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const selectedBlockId = usePageBuilderStore((state) => state.selectedBlockId);
  const hoveredBlockId = usePageBuilderStore((state) => state.hoveredBlockId);
  const selectBlock = usePageBuilderStore((state) => state.selectBlock);
  const hoverBlock = usePageBuilderStore((state) => state.hoverBlock);
  const removeBlock = usePageBuilderStore((state) => state.removeBlock);
  const duplicateBlock = usePageBuilderStore((state) => state.duplicateBlock);
  const setSidebarTab = usePageBuilderStore((state) => state.setSidebarTab);

  const isSelected = selectedBlockId === block.id;
  const isHovered = hoveredBlockId === block.id;
  const definition = BLOCK_DEFINITIONS[block.type];

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSelect = () => {
    selectBlock(block.id);
    setSidebarTab('settings');
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        isDragging && 'opacity-50 z-50'
      )}
      onMouseEnter={() => hoverBlock(block.id)}
      onMouseLeave={() => hoverBlock(null)}
      onClick={handleSelect}
    >
      {/* Block Toolbar */}
      <div
        className={cn(
          'absolute -top-3 left-4 flex items-center gap-1 z-10',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          isSelected && 'opacity-100'
        )}
      >
        <div
          {...attributes}
          {...listeners}
          className="p-1.5 bg-white rounded shadow cursor-grab hover:bg-gray-50"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4 text-gray-500" />
        </div>
        <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded shadow">
          {definition?.label || block.type}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            duplicateBlock(block.id);
          }}
          className="p-1.5 bg-white rounded shadow hover:bg-gray-50"
          title="Duplicate"
        >
          <Copy className="w-4 h-4 text-gray-500" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeBlock(block.id);
          }}
          className="p-1.5 bg-white rounded shadow hover:bg-red-50"
          title="Delete"
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      </div>

      {/* Block Content with Border */}
      <div
        className={cn(
          'border-2 rounded-lg transition-colors',
          isSelected
            ? 'border-orange-500'
            : isHovered
            ? 'border-orange-300'
            : 'border-transparent'
        )}
      >
        {children}
      </div>
    </div>
  );
}

// ============================================
// Add Block Button
// ============================================

interface AddBlockButtonProps {
  index: number;
}

function AddBlockButton({ index }: AddBlockButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const addBlock = usePageBuilderStore((state) => state.addBlock);

  const handleAddBlock = (type: BlockType) => {
    addBlock(type, index);
    setIsOpen(false);
  };

  return (
    <div className="relative py-2 flex justify-center opacity-0 hover:opacity-100 transition-opacity">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1 px-3 py-1.5 rounded-full',
          'bg-orange-100 text-orange-700 text-sm font-medium',
          'hover:bg-orange-200 transition-colors'
        )}
      >
        <Plus className="w-4 h-4" />
        Add Block
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 z-20 bg-white rounded-lg shadow-lg border p-2 min-w-[200px]">
          <div className="grid grid-cols-2 gap-1">
            {Object.values(BLOCK_DEFINITIONS).map((def) => {
              const Icon = def.icon;
              return (
                <button
                  key={def.type}
                  onClick={() => handleAddBlock(def.type)}
                  className="flex items-center gap-2 p-2 rounded hover:bg-orange-50 text-left"
                >
                  <Icon className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">{def.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Block Renderer (Placeholder for now)
// ============================================

interface BlockRendererProps {
  block: ContentBlock;
}

function BlockRenderer({ block }: BlockRendererProps) {
  const definition = BLOCK_DEFINITIONS[block.type];
  const Icon = definition?.icon;

  // Placeholder rendering - will be replaced with actual block components
  return (
    <div className="p-6 bg-gray-50 min-h-[100px]">
      <div className="flex items-center gap-3 mb-3">
        {Icon && <Icon className="w-5 h-5 text-gray-400" />}
        <span className="text-sm font-medium text-gray-600">{definition?.label}</span>
      </div>

      {/* Render based on block type */}
      {block.type === 'hero' && (
        <div className="text-center py-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg text-white">
          <h1 className="text-2xl font-bold mb-2">
            {(block.content as { headline?: string }).headline || 'Hero Title'}
          </h1>
          <p className="text-orange-100">
            {(block.content as { subheadline?: string }).subheadline || 'Subheadline text'}
          </p>
        </div>
      )}

      {block.type === 'text' && (
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{
            __html: (block.content as { html?: string }).html || '<p>Text content...</p>',
          }}
        />
      )}

      {block.type === 'image' && (
        <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
          {(block.content as { src?: string }).src ? (
            <img
              src={(block.content as { src: string }).src}
              alt={(block.content as { alt?: string }).alt || ''}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <span className="text-gray-400">No image selected</span>
          )}
        </div>
      )}

      {block.type === 'feature_grid' && (
        <div className="grid grid-cols-3 gap-4">
          {((block.content as { features?: Array<{ title: string }> }).features || []).map(
            (feature, i) => (
              <div key={i} className="p-4 bg-white rounded-lg shadow-sm text-center">
                <div className="w-10 h-10 bg-orange-100 rounded-full mx-auto mb-2" />
                <p className="text-sm font-medium">{feature.title}</p>
              </div>
            )
          )}
        </div>
      )}

      {!['hero', 'text', 'image', 'feature_grid'].includes(block.type) && (
        <div className="text-center text-gray-400 py-4">
          <p>Block preview: {block.type}</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// Empty State
// ============================================

function EmptyCanvas() {
  const addBlock = usePageBuilderStore((state) => state.addBlock);

  return (
    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
        <Plus className="w-8 h-8 text-orange-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Start Building Your Page</h3>
      <p className="text-gray-500 mb-6 text-center max-w-md">
        Drag blocks from the sidebar or click a button below to add your first block.
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => addBlock('hero')}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Add Hero Section
        </button>
        <button
          onClick={() => addBlock('text')}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Add Text Block
        </button>
      </div>
    </div>
  );
}

// ============================================
// Main Canvas Component
// ============================================

interface BuilderCanvasProps {
  className?: string;
}

export function BuilderCanvas({ className }: BuilderCanvasProps) {
  const blocks = usePageBuilderStore((state) => state.blocks);
  const moveBlock = usePageBuilderStore((state) => state.moveBlock);
  const addBlock = usePageBuilderStore((state) => state.addBlock);
  const isPreviewing = usePageBuilderStore((state) => state.isPreviewing);

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      // Handle dropping from palette
      const activeData = active.data.current;
      if (activeData?.fromPalette && activeData?.type) {
        addBlock(activeData.type as BlockType);
        return;
      }

      // Handle reordering
      if (active.id !== over.id) {
        const oldIndex = blocks.findIndex((b) => b.id === active.id);
        const newIndex = blocks.findIndex((b) => b.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          moveBlock(oldIndex, newIndex);
        }
      }
    },
    [blocks, moveBlock, addBlock]
  );

  const activeBlock = activeId ? blocks.find((b) => b.id === activeId) : null;

  // Preview mode - render without editing UI
  if (isPreviewing) {
    return (
      <div className={cn('min-h-[600px]', className)}>
        {blocks.map((block) => (
          <BlockRenderer key={block.id} block={block} />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={cn('min-h-[600px] p-6', className)}>
        {blocks.length === 0 ? (
          <EmptyCanvas />
        ) : (
          <SortableContext
            items={blocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              <AddBlockButton index={0} />

              {blocks.map((block, index) => (
                <div key={block.id}>
                  <SortableBlock block={block}>
                    <BlockRenderer block={block} />
                  </SortableBlock>
                  <AddBlockButton index={index + 1} />
                </div>
              ))}
            </div>
          </SortableContext>
        )}
      </div>

      <DragOverlay>
        {activeBlock && (
          <div className="bg-white shadow-2xl rounded-lg opacity-80">
            <BlockRenderer block={activeBlock} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

export default BuilderCanvas;
