'use client';

/**
 * CMS Page Builder - Properties Panel
 *
 * Right sidebar for editing selected block properties and page settings.
 */

import { usePageBuilderStore, selectSelectedBlock } from '@/lib/cms/store';
import { BLOCK_DEFINITIONS } from '@/lib/cms/block-registry';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { X, Settings, Sparkles, Image as ImageIcon, Send } from 'lucide-react';
import type { ContentBlock, SEOMetadata, PageStatus } from '@/lib/cms/types';
import { AIGeneratorPanel } from './AIGeneratorPanel';
import { MediaPicker } from './MediaPicker';
import { PublishingWorkflow } from './PublishingWorkflow';
import { VersionHistory } from './VersionHistory';

// ============================================
// Input Components
// ============================================

interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}

function TextInput({ label, value, onChange, placeholder, multiline }: TextInputProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {multiline ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          rows={3}
        />
      ) : (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
      )}
    </div>
  );
}

interface SelectInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

function SelectInput({ label, value, onChange, options }: SelectInputProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ============================================
// Block-Specific Editors
// ============================================

interface BlockEditorProps {
  block: ContentBlock;
  onUpdate: (content: Partial<ContentBlock['content']>) => void;
}

function HeroEditor({ block, onUpdate }: BlockEditorProps) {
  const content = block.content as {
    headline?: string;
    subheadline?: string;
    ctaText?: string;
    ctaUrl?: string;
    backgroundType?: string;
  };

  return (
    <div className="space-y-4">
      <TextInput
        label="Headline"
        value={content.headline || ''}
        onChange={(value) => onUpdate({ headline: value })}
        placeholder="Enter headline"
      />
      <TextInput
        label="Subheadline"
        value={content.subheadline || ''}
        onChange={(value) => onUpdate({ subheadline: value })}
        placeholder="Enter subheadline"
        multiline
      />
      <TextInput
        label="Button Text"
        value={content.ctaText || ''}
        onChange={(value) => onUpdate({ ctaText: value })}
        placeholder="e.g., Get Started"
      />
      <TextInput
        label="Button URL"
        value={content.ctaUrl || ''}
        onChange={(value) => onUpdate({ ctaUrl: value })}
        placeholder="e.g., /contact"
      />
      <SelectInput
        label="Background Style"
        value={content.backgroundType || 'gradient'}
        onChange={(value) => onUpdate({ backgroundType: value })}
        options={[
          { value: 'gradient', label: 'Gradient' },
          { value: 'solid', label: 'Solid Color' },
          { value: 'image', label: 'Image' },
        ]}
      />
    </div>
  );
}

function TextEditor({ block, onUpdate }: BlockEditorProps) {
  const content = block.content as { html?: string; variant?: string };

  return (
    <div className="space-y-4">
      <TextInput
        label="Content"
        value={content.html?.replace(/<[^>]*>/g, '') || ''}
        onChange={(value) => onUpdate({ html: `<p>${value}</p>` })}
        placeholder="Enter text content"
        multiline
      />
      <SelectInput
        label="Style"
        value={content.variant || 'paragraph'}
        onChange={(value) => onUpdate({ variant: value })}
        options={[
          { value: 'paragraph', label: 'Paragraph' },
          { value: 'heading', label: 'Heading' },
          { value: 'quote', label: 'Quote' },
        ]}
      />
    </div>
  );
}

function ImageEditor({ block, onUpdate }: BlockEditorProps) {
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const content = block.content as { src?: string; alt?: string; caption?: string };

  return (
    <div className="space-y-4">
      {/* Image preview and picker button */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Image</label>
        {content.src ? (
          <div className="relative group">
            <img
              src={content.src}
              alt={content.alt || ''}
              className="w-full h-32 object-cover rounded-lg border"
            />
            <button
              onClick={() => setShowMediaPicker(true)}
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white rounded-lg"
            >
              <ImageIcon className="w-6 h-6 mr-2" />
              Change Image
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowMediaPicker(true)}
            className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-orange-500 hover:text-orange-500 transition-colors"
          >
            <ImageIcon className="w-8 h-8 mb-2" />
            <span className="text-sm">Select Image</span>
          </button>
        )}
      </div>

      <TextInput
        label="Image URL"
        value={content.src || ''}
        onChange={(value) => onUpdate({ src: value })}
        placeholder="Or paste URL directly"
      />
      <TextInput
        label="Alt Text"
        value={content.alt || ''}
        onChange={(value) => onUpdate({ alt: value })}
        placeholder="Describe the image"
      />
      <TextInput
        label="Caption"
        value={content.caption || ''}
        onChange={(value) => onUpdate({ caption: value })}
        placeholder="Optional caption"
      />

      {/* Media Picker Modal */}
      <MediaPicker
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(media) => {
          onUpdate({ src: media.url, alt: media.alt });
          setShowMediaPicker(false);
        }}
      />
    </div>
  );
}

function CTAEditor({ block, onUpdate }: BlockEditorProps) {
  const content = block.content as {
    headline?: string;
    description?: string;
    primaryButtonText?: string;
    primaryButtonUrl?: string;
  };

  return (
    <div className="space-y-4">
      <TextInput
        label="Headline"
        value={content.headline || ''}
        onChange={(value) => onUpdate({ headline: value })}
        placeholder="Call to action headline"
      />
      <TextInput
        label="Description"
        value={content.description || ''}
        onChange={(value) => onUpdate({ description: value })}
        placeholder="Supporting text"
        multiline
      />
      <TextInput
        label="Button Text"
        value={content.primaryButtonText || ''}
        onChange={(value) => onUpdate({ primaryButtonText: value })}
        placeholder="e.g., Sign Up Now"
      />
      <TextInput
        label="Button URL"
        value={content.primaryButtonUrl || ''}
        onChange={(value) => onUpdate({ primaryButtonUrl: value })}
        placeholder="e.g., /signup"
      />
    </div>
  );
}

// Generic editor for other block types
function GenericEditor({ block, onUpdate }: BlockEditorProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Edit this block's content directly in the canvas or use the JSON editor below.
      </p>
      <div className="p-3 bg-gray-50 rounded-lg">
        <pre className="text-xs text-gray-600 overflow-auto max-h-40">
          {JSON.stringify(block.content, null, 2)}
        </pre>
      </div>
    </div>
  );
}

// ============================================
// Block Settings Panel
// ============================================

interface BlockSettingsProps {
  block: ContentBlock;
}

function BlockSettings({ block }: BlockSettingsProps) {
  const updateBlockSettings = usePageBuilderStore((state) => state.updateBlockSettings);

  const settings = block.settings || {};

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-900">Layout Settings</h4>

      <SelectInput
        label="Padding"
        value={settings.padding || 'md'}
        onChange={(value) => updateBlockSettings(block.id, { padding: value as 'none' | 'sm' | 'md' | 'lg' | 'xl' })}
        options={[
          { value: 'none', label: 'None' },
          { value: 'sm', label: 'Small' },
          { value: 'md', label: 'Medium' },
          { value: 'lg', label: 'Large' },
          { value: 'xl', label: 'Extra Large' },
        ]}
      />

      <SelectInput
        label="Background"
        value={settings.background || 'transparent'}
        onChange={(value) => updateBlockSettings(block.id, { background: value })}
        options={[
          { value: 'transparent', label: 'Transparent' },
          { value: 'white', label: 'White' },
          { value: 'light', label: 'Light Gray' },
          { value: 'gradient', label: 'Gradient' },
        ]}
      />
    </div>
  );
}

// ============================================
// Page Settings Panel
// ============================================

function PageSettings() {
  const currentPage = usePageBuilderStore((state) => state.currentPage);
  const setPageField = usePageBuilderStore((state) => state.setPageField);

  if (!currentPage) return null;

  // Safely extract SEO metadata with proper defaults
  const seoMetadata: SEOMetadata = {
    title: '',
    description: '',
    keywords: [],
    ...(currentPage.seo_metadata as SEOMetadata || {}),
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Page Details</h3>

        <TextInput
          label="Page Title"
          value={currentPage.title || ''}
          onChange={(value) => setPageField('title', value)}
          placeholder="Enter page title"
        />

        <TextInput
          label="URL Slug"
          value={currentPage.slug || ''}
          onChange={(value) => setPageField('slug', value)}
          placeholder="e.g., about-us"
        />

        <SelectInput
          label="Content Type"
          value={currentPage.content_type || 'landing'}
          onChange={(value) => setPageField('content_type', value as any)}
          options={[
            { value: 'landing', label: 'Landing Page' },
            { value: 'blog', label: 'Blog Post' },
            { value: 'product', label: 'Product Page' },
            { value: 'case_study', label: 'Case Study' },
            { value: 'announcement', label: 'Announcement' },
          ]}
        />

        <SelectInput
          label="Theme"
          value={currentPage.theme || 'light'}
          onChange={(value) => setPageField('theme', value as 'light' | 'dark')}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">SEO Settings</h3>

        <TextInput
          label="Meta Title"
          value={seoMetadata.title || ''}
          onChange={(value) =>
            setPageField('seo_metadata', { ...seoMetadata, title: value })
          }
          placeholder="SEO title (50-60 characters)"
        />

        <TextInput
          label="Meta Description"
          value={seoMetadata.description || ''}
          onChange={(value) =>
            setPageField('seo_metadata', { ...seoMetadata, description: value })
          }
          placeholder="SEO description (150-160 characters)"
          multiline
        />

        <TextInput
          label="Keywords"
          value={Array.isArray(seoMetadata.keywords) ? seoMetadata.keywords.join(', ') : ''}
          onChange={(value) =>
            setPageField('seo_metadata', {
              ...seoMetadata,
              keywords: value ? value.split(',').map((k) => k.trim()).filter(Boolean) : [],
            })
          }
          placeholder="keyword1, keyword2, keyword3"
        />
      </div>
    </div>
  );
}

// ============================================
// Main Properties Panel
// ============================================

interface PropertiesPanelProps {
  className?: string;
}

export function PropertiesPanel({ className }: PropertiesPanelProps) {
  const sidebarTab = usePageBuilderStore((state) => state.sidebarTab);
  const setSidebarTab = usePageBuilderStore((state) => state.setSidebarTab);
  const selectedBlock = usePageBuilderStore(selectSelectedBlock);
  const updateBlockContent = usePageBuilderStore((state) => state.updateBlockContent);
  const selectBlock = usePageBuilderStore((state) => state.selectBlock);
  const currentPage = usePageBuilderStore((state) => state.currentPage);
  const setPageField = usePageBuilderStore((state) => state.setPageField);

  const definition = selectedBlock ? BLOCK_DEFINITIONS[selectedBlock.type] : null;

  // Block content editor based on type
  const renderBlockEditor = () => {
    if (!selectedBlock) return null;

    const editorProps = {
      block: selectedBlock,
      onUpdate: (content: Partial<ContentBlock['content']>) =>
        updateBlockContent(selectedBlock.id, content),
    };

    switch (selectedBlock.type) {
      case 'hero':
        return <HeroEditor {...editorProps} />;
      case 'text':
        return <TextEditor {...editorProps} />;
      case 'image':
        return <ImageEditor {...editorProps} />;
      case 'cta':
        return <CTAEditor {...editorProps} />;
      default:
        return <GenericEditor {...editorProps} />;
    }
  };

  return (
    <div className={cn('bg-white border-l h-full flex flex-col', className)}>
      {/* Tab Navigation */}
      <div className="flex border-b">
        <button
          onClick={() => setSidebarTab('settings')}
          className={cn(
            'flex-1 px-3 py-3 text-sm font-medium',
            sidebarTab === 'settings'
              ? 'text-orange-600 border-b-2 border-orange-500'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <Settings className="w-4 h-4 inline mr-1" />
          {selectedBlock ? 'Block' : 'Page'}
        </button>
        <button
          onClick={() => setSidebarTab('publish')}
          className={cn(
            'flex-1 px-3 py-3 text-sm font-medium',
            sidebarTab === 'publish'
              ? 'text-orange-600 border-b-2 border-orange-500'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <Send className="w-4 h-4 inline mr-1" />
          Publish
        </button>
        <button
          onClick={() => setSidebarTab('ai')}
          className={cn(
            'flex-1 px-3 py-3 text-sm font-medium',
            sidebarTab === 'ai'
              ? 'text-orange-600 border-b-2 border-orange-500'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <Sparkles className="w-4 h-4 inline mr-1" />
          AI
        </button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {sidebarTab === 'settings' && (
          <>
            {selectedBlock ? (
              <div className="space-y-6">
                {/* Block Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {definition && (
                      <definition.icon className="w-5 h-5 text-orange-600" />
                    )}
                    <h3 className="font-medium text-gray-900">
                      {definition?.label || 'Block'}
                    </h3>
                  </div>
                  <button
                    onClick={() => selectBlock(null)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                {/* Block Content Editor */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900">Content</h4>
                  {renderBlockEditor()}
                </div>

                {/* Block Settings */}
                <div className="border-t pt-4">
                  <BlockSettings block={selectedBlock} />
                </div>
              </div>
            ) : (
              <PageSettings />
            )}
          </>
        )}

        {sidebarTab === 'ai' && <AIGeneratorPanel />}

        {sidebarTab === 'publish' && currentPage?.id && (
          <div className="space-y-6">
            <PublishingWorkflow
              pageId={currentPage.id}
              currentStatus={(currentPage.status as PageStatus) || 'draft'}
              scheduledAt={currentPage.scheduled_at}
              publishedAt={currentPage.published_at}
              onStatusChange={(status) => setPageField('status', status)}
            />

            <VersionHistory
              pageId={currentPage.id}
              currentVersion={currentPage.version || 1}
              onRestore={(content) => {
                // Update blocks with restored content
                if (content.blocks) {
                  usePageBuilderStore.setState({
                    blocks: content.blocks,
                    isDirty: true,
                  });
                }
              }}
            />
          </div>
        )}

        {sidebarTab === 'publish' && !currentPage?.id && (
          <div className="text-center py-8">
            <Send className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-2">Save the page first</p>
            <p className="text-xs text-gray-400">
              Publishing options will be available after saving.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PropertiesPanel;
