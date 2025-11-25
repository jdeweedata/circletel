'use client';

/**
 * SEO Metadata Panel Component
 *
 * Comprehensive SEO editing with previews
 * Features:
 * - Meta title/description with character counters
 * - Keywords management (tag input)
 * - Open Graph meta tags
 * - Twitter Card meta tags
 * - Google/Facebook/Twitter previews
 * - Character count warnings
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Search,
  Facebook,
  Twitter,
  AlertCircle,
  CheckCircle,
  X,
  Plus,
} from 'lucide-react';
import type { SEOMetadata } from '@/lib/cms/types';

interface SEOMetadataPanelProps {
  metadata: SEOMetadata;
  onChange: (metadata: SEOMetadata) => void;
  pageUrl?: string;
  defaultImage?: string;
}

const LIMITS = {
  metaTitle: { ideal: 60, max: 70 },
  metaDescription: { ideal: 160, max: 200 },
  ogTitle: { ideal: 60, max: 90 },
  ogDescription: { ideal: 160, max: 200 },
  twitterTitle: { ideal: 60, max: 70 },
  twitterDescription: { ideal: 160, max: 200 },
};

export default function SEOMetadataPanel({
  metadata,
  onChange,
  pageUrl = 'https://www.circletel.co.za/page-slug',
  defaultImage = 'https://www.circletel.co.za/og-image.png',
}: SEOMetadataPanelProps) {
  const [keywordInput, setKeywordInput] = useState('');
  const [activePreview, setActivePreview] = useState<'google' | 'facebook' | 'twitter'>('google');

  // Character counter helper
  const getCharacterStatus = (text: string, limit: { ideal: number; max: number }) => {
    const length = text.length;
    if (length === 0) return { status: 'empty', color: 'text-gray-400', message: 'Required' };
    if (length < limit.ideal) return { status: 'short', color: 'text-yellow-600', message: 'Could be longer' };
    if (length <= limit.max) return { status: 'good', color: 'text-green-600', message: 'Good length' };
    return { status: 'long', color: 'text-red-600', message: 'Too long' };
  };

  // Update metadata
  const updateMetadata = (updates: Partial<SEOMetadata>) => {
    onChange({ ...metadata, ...updates });
  };

  // Keywords management
  const addKeyword = () => {
    if (!keywordInput.trim()) return;
    const keywords = metadata.keywords || [];
    if (!keywords.includes(keywordInput.trim())) {
      updateMetadata({ keywords: [...keywords, keywordInput.trim()] });
    }
    setKeywordInput('');
  };

  const removeKeyword = (keyword: string) => {
    const keywords = metadata.keywords || [];
    updateMetadata({ keywords: keywords.filter(k => k !== keyword) });
  };

  // Title status
  const titleStatus = getCharacterStatus(metadata.metaTitle || '', LIMITS.metaTitle);
  const descStatus = getCharacterStatus(metadata.metaDescription || '', LIMITS.metaDescription);

  return (
    <div className="space-y-6">
      {/* Basic SEO */}
      <Card>
        <CardHeader>
          <CardTitle>Basic SEO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Meta Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={metadata.metaTitle || ''}
              onChange={(e) => updateMetadata({ metaTitle: e.target.value })}
              placeholder="Enter page title for search engines"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
            />
            <div className="flex items-center justify-between mt-1">
              <span className={`text-xs ${titleStatus.color}`}>
                {titleStatus.message}
              </span>
              <span className={`text-xs ${titleStatus.color}`}>
                {(metadata.metaTitle || '').length} / {LIMITS.metaTitle.ideal} chars
              </span>
            </div>
          </div>

          {/* Meta Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={metadata.metaDescription || ''}
              onChange={(e) => updateMetadata({ metaDescription: e.target.value })}
              placeholder="Brief description that appears in search results"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
            />
            <div className="flex items-center justify-between mt-1">
              <span className={`text-xs ${descStatus.color}`}>
                {descStatus.message}
              </span>
              <span className={`text-xs ${descStatus.color}`}>
                {(metadata.metaDescription || '').length} / {LIMITS.metaDescription.ideal} chars
              </span>
            </div>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keywords
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addKeyword();
                  }
                }}
                placeholder="Add keyword and press Enter"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
              />
              <button
                onClick={addKeyword}
                className="px-4 py-2 bg-circleTel-orange text-white rounded-lg hover:bg-orange-600"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(metadata.keywords || []).map((keyword, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  {keyword}
                  <button
                    onClick={() => removeKeyword(keyword)}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Canonical URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Canonical URL
            </label>
            <input
              type="url"
              value={metadata.canonicalUrl || ''}
              onChange={(e) => updateMetadata({ canonicalUrl: e.target.value })}
              placeholder="https://www.circletel.co.za/page-slug"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Helps prevent duplicate content issues
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Open Graph */}
      <Card>
        <CardHeader>
          <CardTitle>Open Graph (Facebook)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OG Title
            </label>
            <input
              type="text"
              value={metadata.ogTitle || metadata.metaTitle || ''}
              onChange={(e) => updateMetadata({ ogTitle: e.target.value })}
              placeholder="Defaults to Meta Title if empty"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OG Description
            </label>
            <textarea
              value={metadata.ogDescription || metadata.metaDescription || ''}
              onChange={(e) => updateMetadata({ ogDescription: e.target.value })}
              placeholder="Defaults to Meta Description if empty"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OG Image URL
            </label>
            <input
              type="url"
              value={metadata.ogImage || ''}
              onChange={(e) => updateMetadata({ ogImage: e.target.value })}
              placeholder="https://www.circletel.co.za/og-image.png"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Recommended: 1200x630px
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OG Type
            </label>
            <select
              value={metadata.ogType || 'website'}
              onChange={(e) => updateMetadata({ ogType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
            >
              <option value="website">Website</option>
              <option value="article">Article</option>
              <option value="product">Product</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Twitter Card */}
      <Card>
        <CardHeader>
          <CardTitle>Twitter Card</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Type
            </label>
            <select
              value={metadata.twitterCard || 'summary_large_image'}
              onChange={(e) => updateMetadata({ twitterCard: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
            >
              <option value="summary">Summary</option>
              <option value="summary_large_image">Summary Large Image</option>
              <option value="app">App</option>
              <option value="player">Player</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Twitter Title
            </label>
            <input
              type="text"
              value={metadata.twitterTitle || metadata.metaTitle || ''}
              onChange={(e) => updateMetadata({ twitterTitle: e.target.value })}
              placeholder="Defaults to Meta Title if empty"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Twitter Description
            </label>
            <textarea
              value={metadata.twitterDescription || metadata.metaDescription || ''}
              onChange={(e) => updateMetadata({ twitterDescription: e.target.value })}
              placeholder="Defaults to Meta Description if empty"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Twitter Image URL
            </label>
            <input
              type="url"
              value={metadata.twitterImage || metadata.ogImage || ''}
              onChange={(e) => updateMetadata({ twitterImage: e.target.value })}
              placeholder="Defaults to OG Image if empty"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Preview</CardTitle>
            <div className="flex gap-2">
              <button
                onClick={() => setActivePreview('google')}
                className={`p-2 rounded ${
                  activePreview === 'google'
                    ? 'bg-circleTel-orange text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActivePreview('facebook')}
                className={`p-2 rounded ${
                  activePreview === 'facebook'
                    ? 'bg-circleTel-orange text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Facebook className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActivePreview('twitter')}
                className={`p-2 rounded ${
                  activePreview === 'twitter'
                    ? 'bg-circleTel-orange text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Twitter className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activePreview === 'google' && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Google Search Result Preview</p>
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-circleTel-orange rounded-full flex items-center justify-center text-white text-xs font-bold">
                    C
                  </div>
                  <span className="text-sm text-gray-600">www.circletel.co.za</span>
                </div>
                <h3 className="text-lg text-blue-600 hover:underline cursor-pointer mb-1">
                  {metadata.metaTitle || 'Page Title'}
                </h3>
                <p className="text-sm text-gray-600">
                  {(metadata.metaDescription || 'Page description').substring(0, LIMITS.metaDescription.ideal)}
                  {(metadata.metaDescription || '').length > LIMITS.metaDescription.ideal && '...'}
                </p>
              </div>
            </div>
          )}

          {activePreview === 'facebook' && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Facebook Share Preview</p>
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <div className="aspect-video bg-gray-200 flex items-center justify-center">
                  {metadata.ogImage ? (
                    <img src={metadata.ogImage} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-sm">No image</span>
                  )}
                </div>
                <div className="p-3 bg-gray-50">
                  <p className="text-xs text-gray-500 uppercase mb-1">www.circletel.co.za</p>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {metadata.ogTitle || metadata.metaTitle || 'Page Title'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {(metadata.ogDescription || metadata.metaDescription || 'Page description').substring(0, 100)}
                    {(metadata.ogDescription || metadata.metaDescription || '').length > 100 && '...'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activePreview === 'twitter' && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Twitter Card Preview</p>
              <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
                <div className="aspect-video bg-gray-200 flex items-center justify-center">
                  {(metadata.twitterImage || metadata.ogImage) ? (
                    <img
                      src={metadata.twitterImage || metadata.ogImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 text-sm">No image</span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {metadata.twitterTitle || metadata.metaTitle || 'Page Title'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {(metadata.twitterDescription || metadata.metaDescription || 'Page description').substring(0, 100)}
                    {(metadata.twitterDescription || metadata.metaDescription || '').length > 100 && '...'}
                  </p>
                  <p className="text-xs text-gray-500">🔗 www.circletel.co.za</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEO Score */}
      <Card>
        <CardHeader>
          <CardTitle>SEO Health Check</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              {metadata.metaTitle ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">Meta Title</p>
                <p className="text-xs text-gray-600">
                  {metadata.metaTitle ? 'Meta title is set' : 'Meta title is required'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              {metadata.metaDescription ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">Meta Description</p>
                <p className="text-xs text-gray-600">
                  {metadata.metaDescription ? 'Meta description is set' : 'Meta description is required'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              {(metadata.keywords || []).length > 0 ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">Keywords</p>
                <p className="text-xs text-gray-600">
                  {(metadata.keywords || []).length > 0
                    ? `${metadata.keywords?.length} keyword(s) added`
                    : 'Add keywords to improve SEO'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              {metadata.ogImage ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">Social Media Image</p>
                <p className="text-xs text-gray-600">
                  {metadata.ogImage ? 'OG image is set' : 'Add an image for better social sharing'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              {titleStatus.status === 'good' ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">Title Length</p>
                <p className="text-xs text-gray-600">
                  {titleStatus.status === 'good'
                    ? 'Title length is optimal'
                    : titleStatus.message}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              {descStatus.status === 'good' ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">Description Length</p>
                <p className="text-xs text-gray-600">
                  {descStatus.status === 'good'
                    ? 'Description length is optimal'
                    : descStatus.message}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
