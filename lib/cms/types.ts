/**
 * CMS Page Builder - TypeScript Types
 *
 * Core type definitions for the drag-and-drop page builder system.
 */

// ============================================
// Block Types
// ============================================

export type BlockType =
  | 'hero'
  | 'text'
  | 'image'
  | 'cta'
  | 'feature_grid'
  | 'testimonial'
  | 'pricing'
  | 'video'
  | 'gallery'
  | 'form'
  | 'divider'
  | 'spacer';

export type BlockCategory = 'layout' | 'content' | 'media' | 'conversion' | 'utility';

export interface BlockSettings {
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  background?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  animation?: 'none' | 'fade' | 'slide-up' | 'slide-down' | 'zoom';
  fullWidth?: boolean;
  centerContent?: boolean;
  customClasses?: string;
}

export interface Block {
  id: string;
  type: BlockType;
  content: Record<string, unknown>;
  settings?: BlockSettings;
}

// Alias for backward compatibility
export type ContentBlock = Block;

// ============================================
// Block Content Types
// ============================================

export interface HeroContent {
  headline: string;
  subheadline?: string;
  ctaText?: string;
  ctaUrl?: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
  backgroundType: 'solid' | 'gradient' | 'image' | 'video';
  backgroundValue?: string;
  alignment?: 'left' | 'center' | 'right';
  variant?: 'standard' | 'split' | 'video-bg';
}

export interface TextContent {
  html: string;
  variant?: 'paragraph' | 'quote' | 'callout';
}

export interface ImageContent {
  src: string;
  alt: string;
  caption?: string;
  link?: string;
  variant?: 'full' | 'side-by-side' | 'rounded';
}

export interface CTAContent {
  headline: string;
  description?: string;
  primaryButtonText: string;
  primaryButtonUrl: string;
  secondaryButtonText?: string;
  secondaryButtonUrl?: string;
  variant?: 'banner' | 'card' | 'inline';
}

export interface FeatureGridContent {
  columns: 2 | 3 | 4;
  features: Array<{
    icon: string;
    title: string;
    description: string;
    link?: string;
  }>;
}

export interface TestimonialContent {
  testimonials: Array<{
    quote: string;
    author: string;
    role?: string;
    company?: string;
    avatarUrl?: string;
  }>;
  variant?: 'single' | 'carousel' | 'grid';
}

export interface PricingContent {
  headline?: string;
  plans: Array<{
    name: string;
    price: string;
    period?: string;
    description?: string;
    features: string[];
    ctaText: string;
    ctaUrl: string;
    highlighted?: boolean;
  }>;
  variant?: 'cards' | 'table';
}

export interface VideoContent {
  url: string;
  platform?: 'youtube' | 'vimeo' | 'custom';
  thumbnailUrl?: string;
  title?: string;
  autoplay?: boolean;
}

export interface GalleryContent {
  images: Array<{
    src: string;
    alt: string;
    caption?: string;
  }>;
  layout?: 'grid' | 'masonry' | 'carousel';
  columns?: 2 | 3 | 4;
}

export interface FormContent {
  formType: 'contact' | 'lead-gen' | 'newsletter' | 'custom';
  fields: Array<{
    name: string;
    type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox';
    label: string;
    placeholder?: string;
    required?: boolean;
    options?: string[];
  }>;
  submitText: string;
  successMessage: string;
  webhookUrl?: string;
}

export interface DividerContent {
  style?: 'line' | 'gradient' | 'dashed' | 'dots';
  color?: string;
  width?: 'full' | 'half' | 'third';
}

export interface SpacerContent {
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

// ============================================
// Page Types
// ============================================

export type ContentType = 'landing' | 'blog' | 'product' | 'case_study' | 'announcement';
export type PageStatus = 'draft' | 'in_review' | 'scheduled' | 'published' | 'archived';

export interface SEOMetadata {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  structuredData?: Record<string, unknown>;
}

export interface CMSPage {
  id: string;
  slug: string;
  title: string;
  content_type: ContentType;
  status: PageStatus;
  content: {
    blocks: Block[];
  };
  seo_metadata: SEOMetadata;
  theme: 'light' | 'dark';
  author_id: string;
  published_at?: string;
  scheduled_at?: string;
  version: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// Template Types
// ============================================

export type TemplateCategory = 'landing' | 'blog' | 'product' | 'marketing' | 'general';

export interface CMSTemplate {
  id: string;
  slug: string;
  name: string;
  description?: string;
  thumbnail_url?: string;
  content: {
    blocks: Block[];
  };
  category: TemplateCategory;
  sort_order: number;
  is_default: boolean;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// Media Types
// ============================================

export interface CMSMedia {
  id: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  storage_path: string;
  public_url: string;
  alt_text?: string;
  caption?: string;
  width?: number;
  height?: number;
  metadata: Record<string, unknown>;
  uploaded_by?: string;
  folder: string;
  created_at: string;
}

// ============================================
// AI Generation Types
// ============================================

export type AIRequestType =
  | 'text_generation'
  | 'image_generation'
  | 'seo_generation'
  | 'content_enhancement'
  | 'content_suggestion'
  | 'full_page';

export interface AIUsageRecord {
  id: string;
  user_id: string;
  request_type: AIRequestType;
  model_used: string;
  prompt_summary?: string;
  input_tokens: number;
  output_tokens: number;
  estimated_cost_cents: number;
  response_time_ms?: number;
  success: boolean;
  error_message?: string;
  created_at: string;
}

export interface AIGenerationRequest {
  type: AIRequestType;
  prompt: string;
  context?: {
    pageType?: ContentType;
    blockType?: BlockType;
    existingContent?: string;
    targetAudience?: string;
    tone?: 'professional' | 'casual' | 'friendly' | 'formal';
    brandVoice?: string;
  };
}

export interface AIGenerationResponse {
  success: boolean;
  content?: Record<string, unknown>;
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    estimatedCostCents: number;
    responseTimeMs: number;
  };
}

export interface RateLimitStatus {
  withinLimits: boolean;
  hourlyCount: number;
  remaining: number;
  resetsAt: string;
}

// ============================================
// Page Builder State Types
// ============================================

export interface PageBuilderState {
  page: CMSPage | null;
  selectedBlockId: string | null;
  isDirty: boolean;
  isPreview: boolean;
  previewDevice: 'desktop' | 'tablet' | 'mobile';
  history: {
    past: Array<{ blocks: Block[] }>;
    future: Array<{ blocks: Block[] }>;
  };
  aiAssistant: {
    isOpen: boolean;
    isLoading: boolean;
    rateLimitStatus: RateLimitStatus | null;
  };
}

export type PageBuilderAction =
  | { type: 'SET_PAGE'; payload: CMSPage }
  | { type: 'SELECT_BLOCK'; payload: string | null }
  | { type: 'ADD_BLOCK'; payload: { block: Block; index?: number } }
  | { type: 'UPDATE_BLOCK'; payload: { id: string; content?: Record<string, unknown>; settings?: BlockSettings } }
  | { type: 'DELETE_BLOCK'; payload: string }
  | { type: 'REORDER_BLOCKS'; payload: { sourceIndex: number; destinationIndex: number } }
  | { type: 'DUPLICATE_BLOCK'; payload: string }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET_PREVIEW'; payload: boolean }
  | { type: 'SET_PREVIEW_DEVICE'; payload: 'desktop' | 'tablet' | 'mobile' }
  | { type: 'TOGGLE_AI_ASSISTANT' }
  | { type: 'SET_AI_LOADING'; payload: boolean }
  | { type: 'SET_RATE_LIMIT_STATUS'; payload: RateLimitStatus }
  | { type: 'MARK_SAVED' };

// ============================================
// API Response Types
// ============================================

export interface PageListResponse {
  pages: CMSPage[];
  total: number;
  page: number;
  limit: number;
}

export interface TemplateListResponse {
  templates: CMSTemplate[];
  total: number;
}

export interface MediaListResponse {
  media: CMSMedia[];
  total: number;
  page: number;
  limit: number;
}

export interface MediaUploadResponse {
  success: boolean;
  media?: CMSMedia;
  error?: string;
}
