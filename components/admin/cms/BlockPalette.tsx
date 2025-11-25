'use client';

/**
 * CMS Page Builder - Block Palette
 *
 * Sidebar component displaying available blocks that can be dragged onto the canvas.
 */

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import {
  BLOCK_DEFINITIONS,
  BLOCK_CATEGORIES,
  getBlocksByCategory,
  type BlockDefinition,
} from '@/lib/cms/block-registry';
import type { BlockCategory, BlockType } from '@/lib/cms/types';
import { usePageBuilderStore } from '@/lib/cms/store';

// ============================================
// Draggable Block Item
// ============================================

interface DraggableBlockProps {
  definition: BlockDefinition;
}

function DraggableBlock({ definition }: DraggableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${definition.type}`,
    data: {
      type: definition.type,
      fromPalette: true,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const Icon = definition.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border cursor-grab',
        'bg-white hover:bg-gray-50 hover:border-orange-300',
        'transition-all duration-150',
        isDragging && 'opacity-50 cursor-grabbing shadow-lg'
      )}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
        <Icon className="w-5 h-5 text-orange-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-900 truncate">{definition.label}</p>
        <p className="text-xs text-gray-500 truncate">{definition.description}</p>
      </div>
    </div>
  );
}

// ============================================
// Block Category Section
// ============================================

interface BlockCategorySectionProps {
  category: BlockCategory;
  blocks: BlockDefinition[];
}

function BlockCategorySection({ category, blocks }: BlockCategorySectionProps) {
  const categoryInfo = BLOCK_CATEGORIES[category];

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">
        {categoryInfo.label}
      </h3>
      <div className="space-y-2">
        {blocks.map((block) => (
          <DraggableBlock key={block.type} definition={block} />
        ))}
      </div>
    </div>
  );
}

// ============================================
// Quick Add Button (Alternative to Drag)
// ============================================

interface QuickAddButtonProps {
  definition: BlockDefinition;
}

function QuickAddButton({ definition }: QuickAddButtonProps) {
  const addBlock = usePageBuilderStore((state) => state.addBlock);
  const Icon = definition.icon;

  return (
    <button
      onClick={() => addBlock(definition.type)}
      className={cn(
        'flex flex-col items-center justify-center p-3 rounded-lg border',
        'bg-white hover:bg-orange-50 hover:border-orange-300',
        'transition-all duration-150 group'
      )}
      title={definition.description}
    >
      <Icon className="w-6 h-6 text-gray-600 group-hover:text-orange-600" />
      <span className="text-xs text-gray-600 mt-1 group-hover:text-orange-700">
        {definition.label}
      </span>
    </button>
  );
}

// ============================================
// Main Block Palette Component
// ============================================

interface BlockPaletteProps {
  variant?: 'list' | 'grid';
  className?: string;
}

export function BlockPalette({ variant = 'list', className }: BlockPaletteProps) {
  const blocksByCategory = getBlocksByCategory();

  if (variant === 'grid') {
    // Quick-add grid view
    return (
      <div className={cn('p-4', className)}>
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Add Block</h2>
        <div className="grid grid-cols-3 gap-2">
          {Object.values(BLOCK_DEFINITIONS).map((definition) => (
            <QuickAddButton key={definition.type} definition={definition} />
          ))}
        </div>
      </div>
    );
  }

  // Draggable list view (default)
  return (
    <div className={cn('p-4 space-y-6', className)}>
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Blocks</h2>
        <p className="text-xs text-gray-500">Drag blocks to the canvas</p>
      </div>

      {(Object.entries(blocksByCategory) as [BlockCategory, BlockDefinition[]][]).map(
        ([category, blocks]) =>
          blocks.length > 0 && (
            <BlockCategorySection key={category} category={category} blocks={blocks} />
          )
      )}
    </div>
  );
}

// ============================================
// Compact Block Picker (for inline use)
// ============================================

interface CompactBlockPickerProps {
  onSelect: (type: BlockType) => void;
  className?: string;
}

export function CompactBlockPicker({ onSelect, className }: CompactBlockPickerProps) {
  return (
    <div className={cn('bg-white rounded-lg shadow-lg border p-3', className)}>
      <p className="text-xs text-gray-500 mb-2">Quick Add Block</p>
      <div className="flex flex-wrap gap-1">
        {Object.values(BLOCK_DEFINITIONS).map((definition) => {
          const Icon = definition.icon;
          return (
            <button
              key={definition.type}
              onClick={() => onSelect(definition.type)}
              className="p-2 rounded hover:bg-orange-50 transition-colors"
              title={definition.label}
            >
              <Icon className="w-4 h-4 text-gray-600" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default BlockPalette;
