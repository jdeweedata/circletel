'use client';

/**
 * CMS Create Page
 *
 * AI-powered content generation interface
 * Features:
 * - AI generation form
 * - Real-time preview
 * - Content editing
 * - Save draft functionality
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AIGenerationForm from '@/components/cms/AIGenerationForm';
import RichTextEditor from '@/components/cms/RichTextEditor';
import { contentToHTML } from '@/lib/cms/content-converter';
import type { PageContent, SEOMetadata } from '@/lib/cms/types';

interface GeneratedContent {
  content: PageContent;
  seo_metadata: SEOMetadata;
  tokens_used: number;
  cost_estimate: number;
  thinking_level_used: string;
  thought_signature?: string;
}

export default function CreatePage() {
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
  const [editedHTML, setEditedHTML] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedPageId, setSavedPageId] = useState<string | null>(null);

  // Page metadata
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [contentType, setContentType] = useState<'landing' | 'blog' | 'product'>('landing');

  const handleGenerate = (data: any) => {
    setGeneratedContent(data);
    // Convert generated content to HTML for editing
    const html = contentToHTML(data.content);
    setEditedHTML(html);
    setIsGenerating(false);
    setViewMode('preview'); // Start with preview

    // Auto-populate title if not set
    if (!title && data.seo_metadata?.metaTitle) {
      setTitle(data.seo_metadata.metaTitle);
    }
  };

  const handleStartGeneration = () => {
    setIsGenerating(true);
  };

  const handleHTMLChange = (html: string) => {
    setEditedHTML(html);
  };

  const generateSlugFromTitle = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleSaveDraft = async () => {
    if (!generatedContent) return;

    // Validate required fields
    if (!title) {
      alert('Please enter a page title');
      return;
    }

    setIsSaving(true);

    try {
      // Generate slug if not provided
      const pageSlug = slug || generateSlugFromTitle(title);

      const pageData = {
        title,
        slug: pageSlug,
        content_type: contentType,
        status: 'draft',
        content: {
          ...generatedContent.content,
          // Store edited HTML as a text section
          sections: [
            ...generatedContent.content.sections,
            {
              type: 'text',
              content: editedHTML,
            },
          ],
        },
        seo_metadata: generatedContent.seo_metadata,
        thought_signature: generatedContent.thought_signature,
      };

      let response;

      if (savedPageId) {
        // Update existing page
        response = await fetch(`/api/cms/pages/${savedPageId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pageData),
        });
      } else {
        // Create new page
        response = await fetch('/api/cms/pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pageData),
        });
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save page');
      }

      setSavedPageId(result.page.id);
      alert(`Page saved successfully as draft! ID: ${result.page.id}`);
    } catch (error) {
      console.error('Save error:', error);
      alert(error instanceof Error ? error.message : 'Failed to save page');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Page</h1>
        <p className="text-muted-foreground">
          Use AI to generate content or start from scratch.
        </p>
      </div>

      {/* Page Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Page Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter page title"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-generated-from-title"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to auto-generate from title
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Type
              </label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as 'landing' | 'blog' | 'product')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
              >
                <option value="landing">Landing Page</option>
                <option value="blog">Blog Post</option>
                <option value="product">Product Page</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generation Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>AI Content Generator</CardTitle>
            </CardHeader>
            <CardContent>
              <AIGenerationForm
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
              />
            </CardContent>
          </Card>
        </div>

        {/* Preview/Edit Panel */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Generated Content</CardTitle>
                {generatedContent && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewMode('preview')}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        viewMode === 'preview'
                          ? 'bg-circleTel-orange text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => setViewMode('edit')}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        viewMode === 'edit'
                          ? 'bg-circleTel-orange text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {generatedContent ? (
                <div className="space-y-6">
                  {/* Edit Mode: Rich Text Editor */}
                  {viewMode === 'edit' ? (
                    <div className="space-y-4">
                      <RichTextEditor
                        content={editedHTML}
                        onChange={handleHTMLChange}
                        placeholder="Edit your content here..."
                        minHeight="500px"
                      />
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                        <p className="text-blue-900">
                          <strong>Tip:</strong> You can edit the generated content directly.
                          Changes are saved automatically. Switch to Preview to see the styled result.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Preview Mode: Styled Content */
                    <>
                      {/* Hero Section */}
                      {generatedContent.content.hero && (
                    <div className="bg-gradient-to-r from-circleTel-orange to-orange-500 text-white p-6 rounded-lg">
                      <h2 className="text-2xl font-bold mb-2">
                        {generatedContent.content.hero.headline}
                      </h2>
                      <p className="text-lg opacity-90 mb-4">
                        {generatedContent.content.hero.subheadline}
                      </p>
                      <div className="flex gap-2">
                        {generatedContent.content.hero.cta_primary && (
                          <button className="px-4 py-2 bg-white text-circleTel-orange rounded-lg font-semibold">
                            {generatedContent.content.hero.cta_primary}
                          </button>
                        )}
                        {generatedContent.content.hero.cta_secondary && (
                          <button className="px-4 py-2 border-2 border-white rounded-lg font-semibold">
                            {generatedContent.content.hero.cta_secondary}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sections */}
                  {generatedContent.content.sections && generatedContent.content.sections.map((section, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-2 text-gray-800">
                        {('heading' in section) ? section.heading : `Section ${index + 1}`}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">Type: {section.type}</p>

                      {/* Features Section */}
                      {section.type === 'features' && (
                        <div className="space-y-2">
                          {section.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="bg-gray-50 p-3 rounded">
                              <h4 className="font-semibold text-gray-800 mb-1">{item.title}</h4>
                              <p className="text-sm text-gray-600">{item.description}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Testimonials Section */}
                      {section.type === 'testimonials' && (
                        <div className="space-y-2">
                          {section.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="bg-gray-50 p-3 rounded">
                              <p className="text-gray-700 italic mb-2">"{item.quote}"</p>
                              <p className="text-sm font-semibold">{item.author}</p>
                              {item.role && <p className="text-xs text-gray-500">{item.role}</p>}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Text Section */}
                      {section.type === 'text' && (
                        <p className="text-gray-700">{section.content}</p>
                      )}

                      {/* CTA Section */}
                      {section.type === 'cta' && (
                        <>
                          <p className="text-gray-700 mb-2">{section.description}</p>
                          <button className="mt-3 px-4 py-2 bg-circleTel-orange text-white rounded-lg">
                            {section.button_text}
                          </button>
                        </>
                      )}

                      {/* Image Section */}
                      {section.type === 'image' && (
                        <div>
                          <img src={section.src} alt={section.alt} className="rounded-lg" />
                          {section.caption && <p className="text-sm text-gray-500 mt-2">{section.caption}</p>}
                        </div>
                      )}

                      {/* Video Section */}
                      {section.type === 'video' && (
                        <div>
                          <p className="text-sm text-gray-600">Video: {section.url}</p>
                          {section.caption && <p className="text-sm text-gray-500 mt-2">{section.caption}</p>}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* SEO Metadata */}
                  {generatedContent.seo_metadata && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">SEO Metadata</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-semibold">Title:</span>
                          <p className="text-gray-700">{generatedContent.seo_metadata.metaTitle}</p>
                        </div>
                        <div>
                          <span className="font-semibold">Description:</span>
                          <p className="text-gray-700">{generatedContent.seo_metadata.metaDescription}</p>
                        </div>
                        {generatedContent.seo_metadata.keywords && generatedContent.seo_metadata.keywords.length > 0 && (
                          <div>
                            <span className="font-semibold">Keywords:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {generatedContent.seo_metadata.keywords.map((keyword, i) => (
                                <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Generation Stats */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Generation Stats</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Tokens Used</p>
                        <p className="font-semibold">{generatedContent.tokens_used}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Cost</p>
                        <p className="font-semibold">${generatedContent.cost_estimate?.toFixed(4)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Quality</p>
                        <p className="font-semibold capitalize">{generatedContent.thinking_level_used}</p>
                      </div>
                    </div>
                  </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveDraft}
                          disabled={isSaving}
                          className="flex-1 px-4 py-2 bg-circleTel-orange text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSaving ? 'Saving...' : savedPageId ? 'Update Draft' : 'Save Draft'}
                        </button>
                        <button
                          onClick={() => {
                            setGeneratedContent(null);
                            setSavedPageId(null);
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Clear
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500">
                    {isGenerating ? 'Generating content...' : 'Fill out the form to generate content'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
