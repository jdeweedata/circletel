'use client';

/**
 * AI Content Generation Form
 *
 * Structured form for generating content with Gemini 3 Pro
 * Features:
 * - Content type selection (landing, blog, product, case study, announcement)
 * - Topic and title inputs
 * - Target audience and tone selectors
 * - Key points multi-input
 * - SEO keywords multi-input
 * - Thinking level toggle
 * - Real-time cost estimation
 * - Loading states and error handling
 */

import { useState, useEffect } from 'react';
import type { ContentType, TargetAudience, ContentTone, ThinkingLevel } from '@/lib/cms/types';

interface RateLimitInfo {
  within_limits: boolean;
  daily_count: number;
  hourly_count: number;
  daily_remaining: number;
  hourly_remaining: number;
}

interface AIGenerationFormProps {
  onGenerate: (content: any) => void;
  isGenerating?: boolean;
}

export default function AIGenerationForm({ onGenerate, isGenerating = false }: AIGenerationFormProps) {
  // Form state
  const [contentType, setContentType] = useState<ContentType>('landing');
  const [topic, setTopic] = useState('');
  const [title, setTitle] = useState('');
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('B2B');
  const [tone, setTone] = useState<ContentTone>('Professional');
  const [keyPoints, setKeyPoints] = useState<string[]>(['']);
  const [seoKeywords, setSeoKeywords] = useState<string[]>(['']);
  const [wordCount, setWordCount] = useState<number>(800);
  const [thinkingLevel, setThinkingLevel] = useState<ThinkingLevel>('high');

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [estimatedCost, setEstimatedCost] = useState<number>(0.008);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const [loadingRateLimit, setLoadingRateLimit] = useState(true);
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceSuccess, setEnhanceSuccess] = useState(false);

  // Fetch rate limit info on mount
  useEffect(() => {
    const fetchRateLimit = async () => {
      try {
        const response = await fetch('/api/cms/generate');
        if (response.ok) {
          const data = await response.json();
          setRateLimitInfo(data);
        }
      } catch (err) {
        console.error('Failed to fetch rate limit:', err);
      } finally {
        setLoadingRateLimit(false);
      }
    };

    fetchRateLimit();
  }, []);

  // Add/remove key points
  const addKeyPoint = () => {
    setKeyPoints([...keyPoints, '']);
  };

  const removeKeyPoint = (index: number) => {
    setKeyPoints(keyPoints.filter((_, i) => i !== index));
  };

  const updateKeyPoint = (index: number, value: string) => {
    const updated = [...keyPoints];
    updated[index] = value;
    setKeyPoints(updated);
  };

  // Add/remove SEO keywords
  const addSeoKeyword = () => {
    setSeoKeywords([...seoKeywords, '']);
  };

  const removeSeoKeyword = (index: number) => {
    setSeoKeywords(seoKeywords.filter((_, i) => i !== index));
  };

  const updateSeoKeyword = (index: number, value: string) => {
    const updated = [...seoKeywords];
    updated[index] = value;
    setSeoKeywords(updated);
  };

  // Enhance topic using AI
  const handleEnhanceTopic = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic first');
      return;
    }

    setEnhancing(true);
    setError(null);
    setEnhanceSuccess(false);

    try {
      const response = await fetch('/api/cms/generate/enhance-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.trim(),
          contentType,
          targetAudience,
          tone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Enhancement failed');
      }

      if (data.success && data.enhanced) {
        // Apply enhanced suggestions
        setTopic(data.enhanced.refined_topic);
        setTitle(data.enhanced.suggested_title);
        setTargetAudience(data.enhanced.target_audience as TargetAudience);
        setTone(data.enhanced.tone as ContentTone);
        setKeyPoints(data.enhanced.key_points);
        setSeoKeywords(data.enhanced.seo_keywords);
        setEnhanceSuccess(true);

        // Show success message briefly
        setTimeout(() => setEnhanceSuccess(false), 3000);
      } else {
        throw new Error('Enhancement failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Enhancement failed';
      setError(errorMessage);
    } finally {
      setEnhancing(false);
    }
  };

  // Update cost estimate based on content type
  const updateCostEstimate = (type: ContentType) => {
    const estimates = {
      landing: 0.008,
      blog: 0.012,
      product: 0.008,
      case_study: 0.010,
      announcement: 0.006,
    };
    setEstimatedCost(estimates[type] || 0.008);
  };

  // Handle content type change
  const handleContentTypeChange = (type: ContentType) => {
    setContentType(type);
    updateCostEstimate(type);

    // Adjust word count based on type
    if (type === 'blog') {
      setWordCount(1200);
    } else if (type === 'announcement') {
      setWordCount(400);
    } else {
      setWordCount(800);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!topic.trim()) {
      setError('Topic is required');
      return;
    }

    // Filter out empty values
    const filteredKeyPoints = keyPoints.filter(p => p.trim() !== '');
    const filteredKeywords = seoKeywords.filter(k => k.trim() !== '');

    try {
      const response = await fetch('/api/cms/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType,
          topic: topic.trim(),
          title: title.trim() || undefined,
          targetAudience,
          tone,
          keyPoints: filteredKeyPoints.length > 0 ? filteredKeyPoints : undefined,
          seoKeywords: filteredKeywords.length > 0 ? filteredKeywords : undefined,
          wordCount: contentType === 'blog' ? wordCount : undefined,
          thinking_level: thinkingLevel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      if (data.success) {
        // Update rate limit info from response
        if (data.rate_limit) {
          setRateLimitInfo({
            within_limits: data.rate_limit.daily_remaining > 0 && data.rate_limit.hourly_remaining > 0,
            daily_count: data.rate_limit.daily_count,
            hourly_count: data.rate_limit.hourly_count,
            daily_remaining: data.rate_limit.daily_remaining,
            hourly_remaining: data.rate_limit.hourly_remaining,
          });
        }
        onGenerate(data);
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';

      // Check for rate limit error
      if (errorMessage.includes('Rate limit exceeded')) {
        setError('⚠️ Rate limit exceeded. Please wait before generating more content.');
      } else {
        setError(errorMessage);
      }
    }
  };

  // Calculate rate limit warnings
  const dailyPercentage = rateLimitInfo
    ? (rateLimitInfo.daily_count / (rateLimitInfo.daily_count + rateLimitInfo.daily_remaining)) * 100
    : 0;
  const showDailyWarning = dailyPercentage >= 70;
  const showDailyCritical = dailyPercentage >= 90;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      {/* Rate Limit Warning */}
      {!loadingRateLimit && rateLimitInfo && (
        <>
          {!rateLimitInfo.within_limits && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Rate Limit Exceeded</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      You have reached your rate limit. Please wait before generating more content.
                    </p>
                    <p className="mt-1 text-xs">
                      Daily: {rateLimitInfo.daily_count} used | Hourly: {rateLimitInfo.hourly_count} used
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {rateLimitInfo.within_limits && showDailyCritical && (
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-orange-800">Approaching Rate Limit</h3>
                  <div className="mt-2 text-sm text-orange-700">
                    <p>
                      You have {rateLimitInfo.daily_remaining} requests remaining today ({rateLimitInfo.hourly_remaining} this hour)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {rateLimitInfo.within_limits && showDailyWarning && !showDailyCritical && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Usage Notice</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      You have {rateLimitInfo.daily_remaining} requests remaining today
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Content Type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Content Type *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {(['landing', 'blog', 'product', 'case_study', 'announcement'] as ContentType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleContentTypeChange(type)}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                contentType === type
                  ? 'border-circleTel-orange bg-circleTel-orange text-white'
                  : 'border-gray-300 hover:border-circleTel-orange'
              }`}
            >
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Topic */}
      <div>
        <label htmlFor="topic" className="block text-sm font-semibold text-gray-700 mb-2">
          Topic *
        </label>
        <div className="flex gap-2">
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., 5G LTE Packages for Small Businesses"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
            required
          />
          <button
            type="button"
            onClick={handleEnhanceTopic}
            disabled={enhancing || !topic.trim() || isGenerating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            {enhancing ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Enhancing...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Enhance
              </>
            )}
          </button>
        </div>
        {enhanceSuccess && (
          <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Topic enhanced! AI has improved your prompt and filled in suggestions below.
          </p>
        )}
      </div>

      {/* Title (optional) */}
      <div>
        <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
          Title <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Fast, Reliable 5G LTE Internet"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
        />
      </div>

      {/* Target Audience & Tone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="audience" className="block text-sm font-semibold text-gray-700 mb-2">
            Target Audience
          </label>
          <select
            id="audience"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value as TargetAudience)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
          >
            <option value="B2B">B2B (Business)</option>
            <option value="B2C">B2C (Consumer)</option>
            <option value="Both">Both B2B & B2C</option>
          </select>
        </div>

        <div>
          <label htmlFor="tone" className="block text-sm font-semibold text-gray-700 mb-2">
            Tone
          </label>
          <select
            id="tone"
            value={tone}
            onChange={(e) => setTone(e.target.value as ContentTone)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
          >
            <option value="Professional">Professional</option>
            <option value="Casual">Casual</option>
            <option value="Technical">Technical</option>
            <option value="Enthusiastic">Enthusiastic</option>
          </select>
        </div>
      </div>

      {/* Word Count (for blogs) */}
      {contentType === 'blog' && (
        <div>
          <label htmlFor="wordCount" className="block text-sm font-semibold text-gray-700 mb-2">
            Target Word Count
          </label>
          <input
            id="wordCount"
            type="number"
            value={wordCount}
            onChange={(e) => setWordCount(parseInt(e.target.value))}
            min={400}
            max={3000}
            step={100}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
          />
        </div>
      )}

      {/* Key Points */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Key Points to Emphasize
        </label>
        <div className="space-y-2">
          {keyPoints.map((point, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={point}
                onChange={(e) => updateKeyPoint(index, e.target.value)}
                placeholder={`Key point ${index + 1}`}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
              />
              {keyPoints.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeKeyPoint(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addKeyPoint}
          className="mt-2 text-sm text-circleTel-orange hover:underline"
        >
          + Add key point
        </button>
      </div>

      {/* SEO Keywords */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          SEO Keywords
        </label>
        <div className="space-y-2">
          {seoKeywords.map((keyword, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={keyword}
                onChange={(e) => updateSeoKeyword(index, e.target.value)}
                placeholder={`Keyword ${index + 1}`}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
              />
              {seoKeywords.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSeoKeyword(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addSeoKeyword}
          className="mt-2 text-sm text-circleTel-orange hover:underline"
        >
          + Add keyword
        </button>
      </div>

      {/* Thinking Level */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Thinking Level
            </label>
            <p className="text-xs text-gray-500 mt-1">
              {thinkingLevel === 'high' ? 'Better quality, slower (20-30s)' : 'Faster generation (10-15s)'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setThinkingLevel(thinkingLevel === 'high' ? 'low' : 'high')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              thinkingLevel === 'high' ? 'bg-circleTel-orange' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                thinkingLevel === 'high' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Cost Estimate */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-700">Estimated Cost</p>
            <p className="text-xs text-gray-500">Per generation</p>
          </div>
          <p className="text-2xl font-bold text-circleTel-orange">
            ${estimatedCost.toFixed(3)}
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isGenerating || !topic.trim() || (rateLimitInfo ? !rateLimitInfo.within_limits : false)}
        className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
          isGenerating || !topic.trim() || (rateLimitInfo ? !rateLimitInfo.within_limits : false)
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-circleTel-orange hover:bg-orange-600'
        }`}
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Generating...
          </span>
        ) : (
          'Generate Content'
        )}
      </button>
    </form>
  );
}
