'use client';

/**
 * CMS Page Builder - AI Generator Panel
 *
 * Component for generating content using Gemini 3 Pro AI.
 * Supports block content, full pages, image generation, and SEO.
 */

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { usePageBuilderStore, selectSelectedBlock } from '@/lib/cms/store';
import { BLOCK_DEFINITIONS } from '@/lib/cms/block-registry';
import type { BlockType, ContentType, RateLimitStatus } from '@/lib/cms/types';
import {
  Sparkles,
  Wand2,
  Image as ImageIcon,
  FileText,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ============================================
// Types
// ============================================

type GenerationMode = 'block' | 'full_page' | 'enhance' | 'seo' | 'image' | 'suggestions';

interface UsageStats {
  hourly: { count: number; limit: number; remaining: number };
  daily: { count: number; limit: number; remaining: number };
  totalTokensToday: number;
  estimatedCostToday: number;
}

// ============================================
// AI Generator Panel Component
// ============================================

interface AIGeneratorPanelProps {
  className?: string;
}

export function AIGeneratorPanel({ className }: AIGeneratorPanelProps) {
  const selectedBlock = usePageBuilderStore(selectSelectedBlock);
  const currentPage = usePageBuilderStore((state) => state.currentPage);
  const updateBlockContent = usePageBuilderStore((state) => state.updateBlockContent);
  const addBlock = usePageBuilderStore((state) => state.addBlock);
  const setPageField = usePageBuilderStore((state) => state.setPageField);

  const [mode, setMode] = useState<GenerationMode>('block');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [showUsageDetails, setShowUsageDetails] = useState(false);

  // Image generation options
  const [imageStyle, setImageStyle] = useState<'photorealistic' | 'illustration' | 'abstract' | 'corporate'>('photorealistic');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('16:9');

  // Full page options
  const [pageContentType, setPageContentType] = useState<ContentType>('landing');

  // Enhancement options
  const [enhanceInstruction, setEnhanceInstruction] = useState('');

  // Suggestions state
  const [suggestions, setSuggestions] = useState<Array<{ title: string; description: string; preview: string }>>([]);

  // Fetch rate limit status on mount
  useEffect(() => {
    fetchUsageStatus();
  }, []);

  const fetchUsageStatus = async () => {
    try {
      const response = await fetch('/api/admin/cms/generate');
      if (response.ok) {
        const data = await response.json();
        setRateLimitStatus(data.rateLimitStatus);
        setUsageStats(data.usageStats);
      }
    } catch (err) {
      console.error('Failed to fetch usage status:', err);
    }
  };

  // Auto-select mode based on selected block
  useEffect(() => {
    if (selectedBlock && mode !== 'image' && mode !== 'seo') {
      setMode('block');
    }
  }, [selectedBlock]);

  const handleGenerate = async () => {
    if (!prompt.trim() && mode !== 'suggestions') {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      let response;

      switch (mode) {
        case 'block':
          if (!selectedBlock) {
            setError('Please select a block first');
            setIsGenerating(false);
            return;
          }
          response = await fetch('/api/admin/cms/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'block',
              blockType: selectedBlock.type,
              prompt: prompt.trim(),
            }),
          });
          break;

        case 'full_page':
          response = await fetch('/api/admin/cms/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'full_page',
              contentType: pageContentType,
              topic: prompt.trim(),
            }),
          });
          break;

        case 'enhance':
          if (!selectedBlock) {
            setError('Please select a block to enhance');
            setIsGenerating(false);
            return;
          }
          response = await fetch('/api/admin/cms/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'enhance',
              content: JSON.stringify(selectedBlock.content),
              instruction: enhanceInstruction || prompt.trim(),
            }),
          });
          break;

        case 'seo':
          if (!currentPage) {
            setError('No page loaded');
            setIsGenerating(false);
            return;
          }
          response = await fetch('/api/admin/cms/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'seo',
              pageTitle: currentPage.title,
              pageContent: prompt.trim() || JSON.stringify(currentPage.content),
            }),
          });
          break;

        case 'image':
          response = await fetch('/api/admin/cms/generate/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: prompt.trim(),
              style: imageStyle,
              aspectRatio,
            }),
          });
          break;

        case 'suggestions':
          if (!selectedBlock) {
            setError('Please select a block first');
            setIsGenerating(false);
            return;
          }
          response = await fetch('/api/admin/cms/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'suggestions',
              blockType: selectedBlock.type,
              context: currentPage?.title || 'CircleTel page',
            }),
          });
          break;
      }

      if (!response) {
        throw new Error('No response from API');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      // Update rate limit status
      if (data.rateLimitStatus) {
        setRateLimitStatus(data.rateLimitStatus);
      }

      // Handle success based on mode
      switch (mode) {
        case 'block':
          if (selectedBlock && data.content) {
            updateBlockContent(selectedBlock.id, data.content);
            setSuccess('Block content updated!');
          }
          break;

        case 'full_page':
          if (data.content?.blocks) {
            // Add all generated blocks to the page
            data.content.blocks.forEach((block: Record<string, unknown>) => {
              addBlock(block.type as BlockType, undefined, block.content as Record<string, unknown>);
            });
            setSuccess(`Added ${data.content.blocks.length} blocks to page!`);
          }
          break;

        case 'enhance':
          if (selectedBlock && data.content?.enhancedContent) {
            // Parse the enhanced content if it's JSON
            try {
              const enhanced = JSON.parse(data.content.enhancedContent);
              updateBlockContent(selectedBlock.id, enhanced);
            } catch {
              // If not JSON, update as HTML for text blocks
              if (selectedBlock.type === 'text') {
                updateBlockContent(selectedBlock.id, { html: data.content.enhancedContent });
              }
            }
            setSuccess('Content enhanced!');
          }
          break;

        case 'seo':
          if (currentPage && data.content) {
            setPageField('seo_metadata', {
              ...currentPage.seo_metadata,
              ...data.content,
            });
            setSuccess('SEO metadata updated!');
          }
          break;

        case 'image':
          if (data.image?.imageUrl) {
            // If a block is selected and it's an image/hero block, update it
            if (selectedBlock && (selectedBlock.type === 'image' || selectedBlock.type === 'hero')) {
              updateBlockContent(selectedBlock.id, {
                src: data.image.imageUrl,
                backgroundValue: data.image.imageUrl,
              });
              setSuccess('Image added to block!');
            } else {
              // Add a new image block
              addBlock('image', undefined, {
                src: data.image.imageUrl,
                alt: prompt.trim(),
              });
              setSuccess('Image block added!');
            }
          }
          break;

        case 'suggestions':
          if (data.content?.suggestions) {
            setSuggestions(data.content.suggestions);
            setSuccess('Suggestions generated!');
          }
          break;
      }

      setPrompt('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Generation failed';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const applySuggestion = (suggestion: { preview: string }) => {
    if (selectedBlock) {
      // Apply suggestion based on block type
      if (selectedBlock.type === 'hero') {
        updateBlockContent(selectedBlock.id, { headline: suggestion.preview });
      } else if (selectedBlock.type === 'text') {
        updateBlockContent(selectedBlock.id, { html: `<p>${suggestion.preview}</p>` });
      } else if (selectedBlock.type === 'cta') {
        updateBlockContent(selectedBlock.id, { headline: suggestion.preview });
      } else {
        // Generic: try to update the first text-like field
        updateBlockContent(selectedBlock.id, { headline: suggestion.preview });
      }
      setSuggestions([]);
      setSuccess('Suggestion applied!');
    }
  };

  const definition = selectedBlock ? BLOCK_DEFINITIONS[selectedBlock.type] : null;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-orange-500" />
        <h3 className="font-medium text-gray-900">AI Content Generator</h3>
      </div>

      {/* Rate Limit Status */}
      {rateLimitStatus && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {rateLimitStatus.remaining} requests remaining
            </span>
            <button
              onClick={() => setShowUsageDetails(!showUsageDetails)}
              className="text-sm text-orange-600 hover:text-orange-700"
            >
              {showUsageDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all',
                rateLimitStatus.remaining > 10 ? 'bg-green-500' :
                rateLimitStatus.remaining > 5 ? 'bg-yellow-500' : 'bg-red-500'
              )}
              style={{ width: `${(rateLimitStatus.remaining / 20) * 100}%` }}
            />
          </div>

          {/* Usage details dropdown */}
          {showUsageDetails && usageStats && (
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Hourly: {usageStats.hourly.count}/{usageStats.hourly.limit}</span>
                <span>Daily: {usageStats.daily.count}/{usageStats.daily.limit}</span>
              </div>
              <div className="flex justify-between">
                <span>Tokens today: {usageStats.totalTokensToday.toLocaleString()}</span>
                <span>Cost: R{(usageStats.estimatedCostToday / 100).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode Selection */}
      <div className="flex flex-wrap gap-2">
        <ModeButton
          active={mode === 'block'}
          onClick={() => setMode('block')}
          icon={<Wand2 className="w-4 h-4" />}
          label="Block"
          disabled={!selectedBlock}
        />
        <ModeButton
          active={mode === 'full_page'}
          onClick={() => setMode('full_page')}
          icon={<FileText className="w-4 h-4" />}
          label="Full Page"
        />
        <ModeButton
          active={mode === 'enhance'}
          onClick={() => setMode('enhance')}
          icon={<Sparkles className="w-4 h-4" />}
          label="Enhance"
          disabled={!selectedBlock}
        />
        <ModeButton
          active={mode === 'seo'}
          onClick={() => setMode('seo')}
          icon={<Search className="w-4 h-4" />}
          label="SEO"
        />
        <ModeButton
          active={mode === 'image'}
          onClick={() => setMode('image')}
          icon={<ImageIcon className="w-4 h-4" />}
          label="Image"
        />
        <ModeButton
          active={mode === 'suggestions'}
          onClick={() => setMode('suggestions')}
          icon={<Lightbulb className="w-4 h-4" />}
          label="Ideas"
          disabled={!selectedBlock}
        />
      </div>

      {/* Mode-specific options */}
      {mode === 'full_page' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Page Type</label>
          <select
            value={pageContentType}
            onChange={(e) => setPageContentType(e.target.value as ContentType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
          >
            <option value="landing">Landing Page</option>
            <option value="blog">Blog Post</option>
            <option value="product">Product Page</option>
            <option value="case_study">Case Study</option>
            <option value="announcement">Announcement</option>
          </select>
        </div>
      )}

      {mode === 'image' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
            <select
              value={imageStyle}
              onChange={(e) => setImageStyle(e.target.value as typeof imageStyle)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
            >
              <option value="photorealistic">Photorealistic</option>
              <option value="illustration">Illustration</option>
              <option value="abstract">Abstract</option>
              <option value="corporate">Corporate</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aspect Ratio</label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as typeof aspectRatio)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
            >
              <option value="16:9">16:9 (Landscape)</option>
              <option value="1:1">1:1 (Square)</option>
              <option value="4:3">4:3 (Standard)</option>
              <option value="3:4">3:4 (Portrait)</option>
              <option value="9:16">9:16 (Story)</option>
            </select>
          </div>
        </div>
      )}

      {/* Context info */}
      {mode === 'block' && selectedBlock && (
        <div className="p-3 bg-orange-50 rounded-lg flex items-center gap-2">
          {definition && <definition.icon className="w-4 h-4 text-orange-600" />}
          <span className="text-sm text-orange-800">
            Generating for: {definition?.label || selectedBlock.type}
          </span>
        </div>
      )}

      {/* Prompt input */}
      {mode !== 'suggestions' && (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            {mode === 'block' ? 'Describe what you want' :
             mode === 'full_page' ? 'Page topic' :
             mode === 'enhance' ? 'Enhancement instruction' :
             mode === 'seo' ? 'Focus keywords (optional)' :
             mode === 'image' ? 'Describe the image' : 'Prompt'}
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              mode === 'block' ? 'e.g., "A hero section about fast fibre internet for businesses"' :
              mode === 'full_page' ? 'e.g., "5G home internet for South African families"' :
              mode === 'enhance' ? 'e.g., "Make it more persuasive and add urgency"' :
              mode === 'seo' ? 'e.g., "fibre internet, home wifi, South Africa"' :
              mode === 'image' ? 'e.g., "Modern office with people using fast internet"' :
              'Enter your prompt...'
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
            rows={3}
          />
        </div>
      )}

      {/* Error/Success messages */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
          <span className="text-sm text-green-700">{success}</span>
        </div>
      )}

      {/* Suggestions list */}
      {mode === 'suggestions' && suggestions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Content Ideas</h4>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => applySuggestion(suggestion)}
              className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-sm text-gray-900">{suggestion.title}</div>
              <div className="text-xs text-gray-500 mt-1">{suggestion.description}</div>
              <div className="text-sm text-gray-700 mt-2 italic">"{suggestion.preview}"</div>
            </button>
          ))}
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || Boolean(rateLimitStatus && !rateLimitStatus.withinLimits)}
        className={cn(
          'w-full px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2',
          isGenerating || Boolean(rateLimitStatus && !rateLimitStatus.withinLimits)
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-orange-500 text-white hover:bg-orange-600'
        )}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            {mode === 'suggestions' ? 'Get Ideas' : 'Generate'}
          </>
        )}
      </button>

      {/* Refresh usage button */}
      <button
        onClick={fetchUsageStatus}
        className="w-full px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center gap-1"
      >
        <RefreshCw className="w-3 h-3" />
        Refresh usage status
      </button>

      {/* Help text */}
      <p className="text-xs text-gray-400 text-center">
        Powered by Gemini 3 Pro • {mode === 'image' ? 'Nano Banana Pro for images' : '1M token context'}
      </p>
    </div>
  );
}

// ============================================
// Mode Button Component
// ============================================

interface ModeButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}

function ModeButton({ active, onClick, icon, label, disabled }: ModeButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors',
        disabled
          ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
          : active
            ? 'bg-orange-100 text-orange-700 font-medium'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      )}
    >
      {icon}
      {label}
    </button>
  );
}

export default AIGeneratorPanel;
