'use client';

/**
 * CMS Page Builder - Template Selector Modal
 *
 * Modal for selecting a template when creating a new page.
 */

import { useState, useEffect } from 'react';
import { usePageBuilderStore } from '@/lib/cms/store';
import { cn } from '@/lib/utils';
import type { CMSTemplate } from '@/lib/cms/types';
import {
  X,
  FileText,
  Loader2,
  Layout,
  Newspaper,
  ShoppingBag,
  Clock,
  Sparkles,
} from 'lucide-react';

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: CMSTemplate | null) => void;
}

// Template icons mapping
const templateIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  blank: FileText,
  landing: Layout,
  blog: Newspaper,
  product: ShoppingBag,
  coming_soon: Clock,
};

export function TemplateSelector({ isOpen, onClose, onSelect }: TemplateSelectorProps) {
  const templates = usePageBuilderStore((state) => state.templates);
  const setTemplates = usePageBuilderStore((state) => state.setTemplates);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<CMSTemplate | null>(null);

  // Fetch templates on mount
  useEffect(() => {
    if (isOpen && templates.length === 0) {
      fetchTemplates();
    } else if (templates.length > 0) {
      setLoading(false);
    }
  }, [isOpen, templates.length]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/cms/templates');
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = () => {
    onSelect(selectedTemplate);
    // Note: Don't call onClose() here - the parent component's onSelect handler
    // will close the modal via setShowTemplateSelector(false) after loading the template
  };

  const handleStartBlank = () => {
    onSelect(null);
    // Note: Don't call onClose() here - the parent component's onSelect handler
    // will close the modal via setShowTemplateSelector(false) after loading the blank page
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Choose a Template</h2>
            <p className="text-sm text-gray-500">
              Start with a template or begin from scratch
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={fetchTemplates}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Blank Page Option */}
              <button
                onClick={() => setSelectedTemplate(null)}
                className={cn(
                  'relative p-4 rounded-xl border-2 transition-all text-left',
                  'hover:border-orange-300 hover:shadow-md',
                  selectedTemplate === null
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 bg-white'
                )}
              >
                <div className="w-full aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                  <FileText className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="font-medium text-gray-900">Blank Page</h3>
                <p className="text-xs text-gray-500 mt-1">Start from scratch</p>
                {selectedTemplate === null && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>

              {/* Template Options */}
              {templates.map((template) => {
                const Icon = templateIcons[template.slug] || Layout;
                const isSelected = selectedTemplate?.id === template.id;

                return (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={cn(
                      'relative p-4 rounded-xl border-2 transition-all text-left',
                      'hover:border-orange-300 hover:shadow-md',
                      isSelected
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 bg-white'
                    )}
                  >
                    {/* Template Preview */}
                    <div className="w-full aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                      {template.thumbnail_url ? (
                        <img
                          src={template.thumbnail_url}
                          alt={template.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Icon className="w-12 h-12 text-gray-400" />
                      )}
                    </div>

                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {template.description}
                    </p>

                    {/* Category Badge */}
                    <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full capitalize">
                      {template.category}
                    </span>

                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSelect}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            {selectedTemplate ? 'Use Template' : 'Start Blank'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TemplateSelector;
