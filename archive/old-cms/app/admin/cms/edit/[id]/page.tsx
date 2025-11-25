'use client';

/**
 * CMS Edit Page
 *
 * Edit existing pages with AI regeneration
 * Features:
 * - Load existing page content
 * - Edit with rich text editor
 * - AI regeneration with context
 * - Update and publish functionality
 */

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AIGenerationForm from '@/components/cms/AIGenerationForm';
import RichTextEditor from '@/components/cms/RichTextEditor';
import PublishingWorkflow, { type PageStatus } from '@/components/cms/PublishingWorkflow';
import SEOMetadataPanel from '@/components/cms/SEOMetadataPanel';
import BrowserChrome from '@/components/cms/BrowserChrome';
import { contentToHTML } from '@/lib/cms/content-converter';
import type { PageContent, SEOMetadata } from '@/lib/cms/types';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

interface Page {
  id: string;
  slug: string;
  title: string;
  content_type: string;
  status: string;
  content: PageContent;
  seo_metadata: SEOMetadata;
  featured_image: string | null;
  author_id: string;
  scheduled_at: string | null;
  published_at: string | null;
  thought_signature: string | null;
  created_at: string;
  updated_at: string;
}

interface GeneratedContent {
  content: PageContent;
  seo_metadata: SEOMetadata;
  tokens_used: number;
  cost_estimate: number;
  thinking_level_used: string;
  thought_signature?: string;
}

export default function EditPage() {
  const params = useParams();
  const router = useRouter();
  const pageId = params.id as string;

  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
  const [editedHTML, setEditedHTML] = useState<string>('');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content');

  // Editable fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [contentType, setContentType] = useState<'landing' | 'blog' | 'product'>('landing');
  const [status, setStatus] = useState<PageStatus>('draft');
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);

  // Load existing page
  useEffect(() => {
    const loadPage = async () => {
      try {
        const response = await fetch(`/api/cms/pages/${pageId}`);
        const data = await response.json();

        if (response.ok) {
          setPage(data.page);
          setTitle(data.page.title);
          setSlug(data.page.slug);
          setContentType(data.page.content_type);
          setStatus(data.page.status);
          setScheduledAt(data.page.scheduled_at);

          // Convert content to HTML
          const html = contentToHTML(data.page.content);
          setEditedHTML(html);
        } else {
          alert(`Failed to load page: ${data.error}`);
          router.push('/admin/cms');
        }
      } catch (error) {
        console.error('Page load error:', error);
        alert('Failed to load page');
        router.push('/admin/cms');
      } finally {
        setLoading(false);
      }
    };

    if (pageId) {
      loadPage();
    }
  }, [pageId, router]);

  const handleHTMLChange = (html: string) => {
    setEditedHTML(html);
  };

  const handleSEOChange = (seoMetadata: SEOMetadata) => {
    if (!page) return;
    setPage({
      ...page,
      seo_metadata: seoMetadata,
    });
  };

  const handleAIRegenerate = (data: GeneratedContent) => {
    if (!page) return;

    // Update page with new AI-generated content
    const html = contentToHTML(data.content);
    setEditedHTML(html);

    // Update page state
    setPage({
      ...page,
      content: data.content,
      seo_metadata: data.seo_metadata,
      thought_signature: data.thought_signature || null,
    });

    setShowAIPanel(false);
  };

  const handleSave = async () => {
    if (!page) return;

    if (!title) {
      alert('Please enter a page title');
      return;
    }

    setIsSaving(true);

    try {
      const pageData = {
        title,
        slug,
        content_type: contentType,
        status,
        scheduled_at: scheduledAt,
        content: {
          ...page.content,
          sections: [
            ...page.content.sections,
            {
              type: 'text',
              content: editedHTML,
            },
          ],
        },
        seo_metadata: page.seo_metadata,
        thought_signature: page.thought_signature,
      };

      const response = await fetch(`/api/cms/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update page');
      }

      setPage(result.page);
      alert('Page saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert(error instanceof Error ? error.message : 'Failed to save page');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: PageStatus, newScheduledAt?: string) => {
    if (!page) return;

    setIsSaving(true);

    try {
      const updateData: any = {
        status: newStatus,
      };

      if (newScheduledAt) {
        updateData.scheduled_at = newScheduledAt;
      } else if (newStatus !== 'scheduled') {
        updateData.scheduled_at = null;
      }

      const response = await fetch(`/api/cms/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update status');
      }

      // Update local state
      setPage(result.page);
      setStatus(newStatus);
      setScheduledAt(newScheduledAt || null);

      alert(`Page status updated to ${newStatus.replace('_', ' ')}!`);

      // Redirect if published
      if (newStatus === 'published') {
        setTimeout(() => router.push('/admin/cms'), 1500);
      }
    } catch (error) {
      console.error('Status change error:', error);
      alert(error instanceof Error ? error.message : 'Failed to update status');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-circleTel-orange mx-auto mb-4"></div>
          <p className="text-gray-500">Loading page...</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Page not found</p>
          <Link href="/admin/cms" className="text-circleTel-orange hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/cms"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Page</h1>
            <p className="text-muted-foreground">
              Last updated: {formatDate(page.updated_at)}
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-circleTel-orange text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Page Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Page Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                placeholder="page-url-slug"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Type
              </label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as any)}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Publishing Workflow */}
        <div>
          <PublishingWorkflow
            currentStatus={status}
            scheduledAt={scheduledAt}
            publishedAt={page.published_at}
            onStatusChange={handleStatusChange}
            canPublish={true}
            canArchive={true}
            isUpdating={isSaving}
          />
        </div>

        {/* Content Column - spans 2 columns */}
        <div className="lg:col-span-2 space-y-6">
        {/* AI Panel (Optional) */}
        {showAIPanel && (
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>AI Regenerate</CardTitle>
                  <button
                    onClick={() => setShowAIPanel(false)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Hide
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <AIGenerationForm
                  onGenerate={handleAIRegenerate}
                  isGenerating={false}
                />
                {page.thought_signature && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                    <p className="text-blue-900">
                      <strong>Context Available:</strong> This page has AI context from previous generation.
                      Regenerating will use this context for better continuity.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content & SEO Tabs */}
        <div className={showAIPanel ? '' : 'lg:col-span-2'}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveTab('content')}
                    className={`pb-2 border-b-2 font-semibold transition-colors ${
                      activeTab === 'content'
                        ? 'border-circleTel-orange text-circleTel-orange'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Content
                  </button>
                  <button
                    onClick={() => setActiveTab('seo')}
                    className={`pb-2 border-b-2 font-semibold transition-colors ${
                      activeTab === 'seo'
                        ? 'border-circleTel-orange text-circleTel-orange'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    SEO & Social
                  </button>
                </div>
                {activeTab === 'content' && (
                  <div className="flex gap-2">
                    {!showAIPanel && (
                      <button
                        onClick={() => setShowAIPanel(true)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      >
                        AI Regenerate
                      </button>
                    )}
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
              {activeTab === 'content' && viewMode === 'edit' ? (
                <div className="space-y-4">
                  <RichTextEditor
                    content={editedHTML}
                    onChange={handleHTMLChange}
                    placeholder="Edit your content here..."
                    minHeight="600px"
                  />
                </div>
              ) : activeTab === 'content' && viewMode === 'preview' ? (
                <BrowserChrome url={`www.circletel.co.za/${slug}`}>
                  <div className="space-y-6 p-6">
                    {/* Hero Section */}
                    {page.content.hero && (
                      <div className="bg-gradient-to-r from-circleTel-orange to-orange-500 text-white p-6 rounded-lg">
                        <h2 className="text-2xl font-bold mb-2">
                          {page.content.hero.headline}
                        </h2>
                        <p className="text-lg opacity-90 mb-4">
                          {page.content.hero.subheadline}
                        </p>
                        <div className="flex gap-2">
                          {page.content.hero.cta_primary && (
                            <button className="px-4 py-2 bg-white text-circleTel-orange rounded-lg font-semibold">
                              {page.content.hero.cta_primary}
                            </button>
                          )}
                          {page.content.hero.cta_secondary && (
                            <button className="px-4 py-2 border-2 border-white rounded-lg font-semibold">
                              {page.content.hero.cta_secondary}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* HTML Content */}
                    <div
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: editedHTML }}
                    />

                    {/* SEO Metadata */}
                    {page.seo_metadata && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">SEO Metadata</h3>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-semibold">Title:</span>
                            <p className="text-gray-700">{page.seo_metadata.metaTitle}</p>
                          </div>
                          <div>
                            <span className="font-semibold">Description:</span>
                            <p className="text-gray-700">{page.seo_metadata.metaDescription}</p>
                          </div>
                          {page.seo_metadata.keywords && page.seo_metadata.keywords.length > 0 && (
                            <div>
                              <span className="font-semibold">Keywords:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {page.seo_metadata.keywords.map((keyword, i) => (
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
                  </div>
                </BrowserChrome>
              ) : activeTab === 'seo' ? (
                <SEOMetadataPanel
                  metadata={page.seo_metadata}
                  onChange={handleSEOChange}
                  pageUrl={`https://www.circletel.co.za/${slug || 'page-slug'}`}
                />
              ) : null}
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
}
