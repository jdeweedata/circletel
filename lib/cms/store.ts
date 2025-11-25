/**
 * CMS Page Builder - Zustand Store
 *
 * State management for the drag-and-drop page builder.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  BlockType,
  ContentBlock,
  CMSPage,
  CMSTemplate,
  ContentType,
  PageStatus,
  SEOMetadata,
} from './types';
import { createBlock, BLOCK_DEFINITIONS } from './block-registry';

// ============================================
// Types
// ============================================

export interface PageBuilderState {
  // Page data
  currentPage: Partial<CMSPage> | null;
  blocks: ContentBlock[];
  isDirty: boolean;

  // Selection state
  selectedBlockId: string | null;
  hoveredBlockId: string | null;

  // UI state
  isPreviewing: boolean;
  isAIGenerating: boolean;
  isSaving: boolean;
  sidebarTab: 'blocks' | 'settings' | 'ai' | 'publish';

  // History for undo/redo
  history: ContentBlock[][];
  historyIndex: number;

  // Templates
  templates: CMSTemplate[];
}

export interface PageBuilderActions {
  // Page actions
  initPage: (page?: Partial<CMSPage>) => void;
  setPageField: <K extends keyof CMSPage>(field: K, value: CMSPage[K]) => void;
  savePage: () => Promise<void>;
  publishPage: () => Promise<void>;

  // Block actions
  addBlock: (type: BlockType, index?: number, content?: Record<string, unknown>) => void;
  removeBlock: (blockId: string) => void;
  duplicateBlock: (blockId: string) => void;
  moveBlock: (fromIndex: number, toIndex: number) => void;
  updateBlockContent: (blockId: string, content: Partial<ContentBlock['content']>) => void;
  updateBlockSettings: (blockId: string, settings: Partial<ContentBlock['settings']>) => void;

  // Selection actions
  selectBlock: (blockId: string | null) => void;
  hoverBlock: (blockId: string | null) => void;

  // UI actions
  setPreviewMode: (preview: boolean) => void;
  setAIGenerating: (generating: boolean) => void;
  setSidebarTab: (tab: 'blocks' | 'settings' | 'ai' | 'publish') => void;

  // History actions
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;

  // Template actions
  loadTemplate: (template: CMSTemplate) => void;
  setTemplates: (templates: CMSTemplate[]) => void;

  // Reset
  reset: () => void;
}

// ============================================
// Initial State
// ============================================

const initialState: PageBuilderState = {
  currentPage: null,
  blocks: [],
  isDirty: false,
  selectedBlockId: null,
  hoveredBlockId: null,
  isPreviewing: false,
  isAIGenerating: false,
  isSaving: false,
  sidebarTab: 'blocks',
  history: [],
  historyIndex: -1,
  templates: [],
};

// ============================================
// Store
// ============================================

export const usePageBuilderStore = create<PageBuilderState & PageBuilderActions>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // ============================================
        // Page Actions
        // ============================================

        initPage: (page) => {
          set((state) => {
            state.currentPage = page || {
              title: 'Untitled Page',
              slug: '',
              content_type: 'landing' as ContentType,
              status: 'draft' as PageStatus,
              theme: 'light',
              seo_metadata: {},
            };
            state.blocks = (page?.content as { blocks?: ContentBlock[] })?.blocks || [];
            state.isDirty = false;
            state.selectedBlockId = null;
            state.history = [state.blocks];
            state.historyIndex = 0;
          });
        },

        setPageField: (field, value) => {
          set((state) => {
            if (state.currentPage) {
              (state.currentPage as Record<string, unknown>)[field] = value;
              state.isDirty = true;
            }
          });
        },

        savePage: async () => {
          const { currentPage, blocks } = get();
          if (!currentPage) return;

          set({ isSaving: true });

          try {
            const pageData = {
              ...currentPage,
              content: { blocks },
            };

            // API call would go here
            const response = await fetch('/api/admin/cms/pages', {
              method: currentPage.id ? 'PUT' : 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(pageData),
            });

            if (!response.ok) throw new Error('Failed to save page');

            const savedPage = await response.json();

            set((state) => {
              state.currentPage = savedPage;
              state.isDirty = false;
            });
          } finally {
            set({ isSaving: false });
          }
        },

        publishPage: async () => {
          const { currentPage, savePage } = get();
          if (!currentPage) return;

          set((state) => {
            if (state.currentPage) {
              state.currentPage.status = 'published';
              state.currentPage.published_at = new Date().toISOString();
            }
          });

          await savePage();
        },

        // ============================================
        // Block Actions
        // ============================================

        addBlock: (type, index, content) => {
          const newBlock = createBlock(type, content);

          set((state) => {
            if (typeof index === 'number') {
              state.blocks.splice(index, 0, newBlock as ContentBlock);
            } else {
              state.blocks.push(newBlock as ContentBlock);
            }
            state.selectedBlockId = newBlock.id;
            state.isDirty = true;
          });

          get().saveToHistory();
        },

        removeBlock: (blockId) => {
          set((state) => {
            const index = state.blocks.findIndex((b) => b.id === blockId);
            if (index !== -1) {
              state.blocks.splice(index, 1);
              if (state.selectedBlockId === blockId) {
                state.selectedBlockId = null;
              }
              state.isDirty = true;
            }
          });

          get().saveToHistory();
        },

        duplicateBlock: (blockId) => {
          const { blocks } = get();
          const block = blocks.find((b) => b.id === blockId);
          if (!block) return;

          const definition = BLOCK_DEFINITIONS[block.type];
          if (!definition) return;

          const newBlock = createBlock(block.type, block.content);

          set((state) => {
            const index = state.blocks.findIndex((b) => b.id === blockId);
            state.blocks.splice(index + 1, 0, newBlock as ContentBlock);
            state.selectedBlockId = newBlock.id;
            state.isDirty = true;
          });

          get().saveToHistory();
        },

        moveBlock: (fromIndex, toIndex) => {
          set((state) => {
            const [block] = state.blocks.splice(fromIndex, 1);
            state.blocks.splice(toIndex, 0, block);
            state.isDirty = true;
          });

          get().saveToHistory();
        },

        updateBlockContent: (blockId, content) => {
          set((state) => {
            const block = state.blocks.find((b) => b.id === blockId);
            if (block) {
              block.content = { ...block.content, ...content };
              state.isDirty = true;
            }
          });
        },

        updateBlockSettings: (blockId, settings) => {
          set((state) => {
            const block = state.blocks.find((b) => b.id === blockId);
            if (block) {
              block.settings = { ...block.settings, ...settings };
              state.isDirty = true;
            }
          });
        },

        // ============================================
        // Selection Actions
        // ============================================

        selectBlock: (blockId) => {
          set({ selectedBlockId: blockId });
        },

        hoverBlock: (blockId) => {
          set({ hoveredBlockId: blockId });
        },

        // ============================================
        // UI Actions
        // ============================================

        setPreviewMode: (preview) => {
          set({ isPreviewing: preview, selectedBlockId: null });
        },

        setAIGenerating: (generating) => {
          set({ isAIGenerating: generating });
        },

        setSidebarTab: (tab) => {
          set({ sidebarTab: tab });
        },

        // ============================================
        // History Actions
        // ============================================

        saveToHistory: () => {
          set((state) => {
            // Remove any future history if we're not at the end
            if (state.historyIndex < state.history.length - 1) {
              state.history = state.history.slice(0, state.historyIndex + 1);
            }

            // Add current state to history
            state.history.push(JSON.parse(JSON.stringify(state.blocks)));
            state.historyIndex = state.history.length - 1;

            // Limit history size
            if (state.history.length > 50) {
              state.history.shift();
              state.historyIndex--;
            }
          });
        },

        undo: () => {
          set((state) => {
            if (state.historyIndex > 0) {
              state.historyIndex--;
              state.blocks = JSON.parse(JSON.stringify(state.history[state.historyIndex]));
              state.selectedBlockId = null;
              state.isDirty = true;
            }
          });
        },

        redo: () => {
          set((state) => {
            if (state.historyIndex < state.history.length - 1) {
              state.historyIndex++;
              state.blocks = JSON.parse(JSON.stringify(state.history[state.historyIndex]));
              state.selectedBlockId = null;
              state.isDirty = true;
            }
          });
        },

        // ============================================
        // Template Actions
        // ============================================

        loadTemplate: (template) => {
          const templateContent = template.content as { blocks?: ContentBlock[] };

          set((state) => {
            state.blocks = templateContent.blocks || [];
            state.isDirty = true;
            state.selectedBlockId = null;
          });

          get().saveToHistory();
        },

        setTemplates: (templates) => {
          set({ templates });
        },

        // ============================================
        // Reset
        // ============================================

        reset: () => {
          set(initialState);
        },
      })),
      {
        name: 'page-builder-storage',
        partialize: (state) => ({
          // Only persist page data, not UI state
          currentPage: state.currentPage,
          blocks: state.blocks,
        }),
      }
    ),
    { name: 'PageBuilder' }
  )
);

// ============================================
// Selectors
// ============================================

export const selectSelectedBlock = (state: PageBuilderState) => {
  if (!state.selectedBlockId) return null;
  return state.blocks.find((b) => b.id === state.selectedBlockId) || null;
};

export const selectCanUndo = (state: PageBuilderState) => state.historyIndex > 0;
export const selectCanRedo = (state: PageBuilderState) => state.historyIndex < state.history.length - 1;
