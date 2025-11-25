/**
 * CircleTel AI-Powered No-Code CMS - Type Definitions
 * Comprehensive TypeScript interfaces for the CMS system
 */

// TODO: Uncomment after database migrations are applied
// import { Database } from '@/lib/types/database.types';

// ============================================================================
// Database Types (will be available after migrations)
// ============================================================================

// TODO: Uncomment after database migrations are applied
// export type PageRow = Database['public']['Tables']['pages']['Row'];
// export type PageInsert = Database['public']['Tables']['pages']['Insert'];
// export type PageUpdate = Database['public']['Tables']['pages']['Update'];

// export type MediaLibraryRow = Database['public']['Tables']['media_library']['Row'];
// export type MediaLibraryInsert = Database['public']['Tables']['media_library']['Insert'];
// export type MediaLibraryUpdate = Database['public']['Tables']['media_library']['Update'];

// export type CMSAIUsageRow = Database['public']['Tables']['cms_ai_usage']['Row'];
// export type CMSAIUsageInsert = Database['public']['Tables']['cms_ai_usage']['Insert'];

// ============================================================================
// Content Type Definitions
// ============================================================================

export type ContentType = 'landing' | 'blog' | 'product' | 'case_study' | 'announcement';

export type ContentStatus = 'draft' | 'in_review' | 'scheduled' | 'published' | 'archived';

export type TargetAudience = 'B2B' | 'B2C' | 'Internal' | 'Partners';

export type ContentTone = 'Professional' | 'Casual' | 'Enthusiastic' | 'Technical' | 'Friendly';

// ============================================================================
// Gemini 3 Specific Types
// ============================================================================

export type ThinkingLevel = 'low' | 'high';

export type MediaResolutionLevel =
  | 'media_resolution_low'     // 280 tokens (images), 70 tokens (video)
  | 'media_resolution_medium'  // 560 tokens (images), 70 tokens (video)
  | 'media_resolution_high';   // 1120 tokens (images), 280 tokens (video)

/**
 * Thought Signature - Encrypted representation of Gemini 3's reasoning context
 * CRITICAL: Must be returned in subsequent requests to maintain reasoning chain
 * See: https://ai.google.dev/gemini-api/docs/thought-signatures
 */
export interface ThoughtSignature {
  signature: string;
}

/**
 * Gemini 3 Generation Config
 * Based on: https://ai.google.dev/gemini-api/docs/gemini-3
 */
export interface Gemini3Config {
  model: 'gemini-3-pro-preview';
  thinking_level?: ThinkingLevel; // Default: 'high'
  temperature?: 1.0; // MUST be 1.0 for Gemini 3 (do not change!)
  media_resolution?: MediaResolutionLevel;
  max_output_tokens?: number;
  response_mime_type?: 'text/plain' | 'application/json';
  response_json_schema?: Record<string, unknown>;
}

// ============================================================================
// AI Generation Request Types
// ============================================================================

export interface AIGenerationRequest {
  contentType: ContentType;
  topic: string;
  title?: string;
  targetAudience?: TargetAudience;
  tone?: ContentTone;
  keyPoints?: string[];
  wordCount?: number;
  includeImages?: boolean;
  seoKeywords?: string[];
  // Gemini 3 specific
  thinking_level?: ThinkingLevel;
  previous_thought_signature?: string; // For multi-turn conversations
}

export interface AIImageRequest {
  prompt: string;
  style: 'photorealistic' | 'illustration' | 'abstract' | 'professional';
  aspectRatio: '16:9' | '3:2' | '1:1' | '4:5';
  variations?: number;
  // Gemini 3 specific
  media_resolution?: MediaResolutionLevel;
}

// ============================================================================
// Content Structure Types (JSONB schemas)
// ============================================================================

export interface HeroSection {
  headline: string;
  subheadline: string;
  cta_primary: string;
  cta_primary_url?: string;
  cta_secondary?: string;
  cta_secondary_url?: string;
  background_image?: string;
}

export interface FeatureItem {
  icon?: string;
  title: string;
  description: string;
}

export interface FeaturesSection {
  type: 'features';
  heading: string;
  subheading?: string;
  layout: 'grid-3' | 'grid-2' | 'list';
  items: FeatureItem[];
}

export interface TestimonialItem {
  quote: string;
  author: string;
  role?: string;
  company?: string;
  avatar?: string;
  rating?: number;
}

export interface TestimonialsSection {
  type: 'testimonials';
  heading: string;
  items: TestimonialItem[];
}

export interface CTASection {
  type: 'cta';
  heading: string;
  description: string;
  button_text: string;
  button_url: string;
  background_color?: string;
}

export interface TextSection {
  type: 'text';
  heading?: string;
  content: string; // HTML or Markdown
}

export interface ImageSection {
  type: 'image';
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface VideoSection {
  type: 'video';
  url: string; // YouTube or Vimeo URL
  thumbnail?: string;
  caption?: string;
}

export interface PricingItem {
  title: string;
  price: string;
  original_price?: string;
  period?: string;
  features: string[];
  cta_text: string;
  cta_url: string;
  badge?: string;
  highlight?: boolean;
}

export interface PricingSection {
  type: 'pricing';
  heading: string;
  subheading?: string;
  items: PricingItem[];
}

export type ContentSection =
  | FeaturesSection
  | TestimonialsSection
  | CTASection
  | TextSection
  | ImageSection
  | VideoSection
  | PricingSection;

export type PageTheme = 'light' | 'dark' | 'black_friday';

export interface PageContent {
  hero?: HeroSection;
  sections: ContentSection[];
  theme?: PageTheme;
}

// ============================================================================
// SEO Metadata Types
// ============================================================================

export interface SEOMetadata {
  metaTitle: string;
  metaDescription: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

// ============================================================================
// Content Version History
// ============================================================================

export interface ContentVersion {
  version: number;
  content: PageContent;
  seo_metadata?: SEOMetadata;
  updated_by: string; // UUID
  updated_at: string; // ISO timestamp
  change_summary?: string;
}

// ============================================================================
// Complete Page Type (with relations)
// TODO: Uncomment after database migrations are applied
// ============================================================================

// export interface Page extends PageRow {
//   author?: {
//     id: string;
//     email?: string;
//     full_name?: string;
//   };
//   content: PageContent;
//   seo_metadata?: SEOMetadata;
//   content_history?: ContentVersion[];
// }

// ============================================================================
// Media Library Types
// TODO: Uncomment after database migrations are applied
// ============================================================================

// export interface MediaFile extends MediaLibraryRow {
//   uploader?: {
//     id: string;
//     email?: string;
//     full_name?: string;
//   };
// }

export interface MediaUploadRequest {
  file: File;
  alt_text?: string;
  tags?: string[];
}

export interface MediaUploadResponse {
  id: string;
  public_url: string;
  storage_path: string;
  width?: number;
  height?: number;
  size_bytes: number;
}

// ============================================================================
// AI Generation Response Types
// ============================================================================

export interface AIContentGenerationResponse {
  success: boolean;
  content?: PageContent;
  seo_metadata?: SEOMetadata;
  error?: string;
  tokens_used?: number;
  cost_estimate?: number;
  // Gemini 3 specific
  thought_signature?: string; // MUST be stored and returned in follow-up requests
  thinking_level_used?: ThinkingLevel;
}

export interface AIImageGenerationResponse {
  success: boolean;
  images?: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  error?: string;
  tokens_used?: number;
  cost_estimate?: number;
  // Gemini 3 specific
  thought_signature?: string;
  media_resolution_used?: MediaResolutionLevel;
}

// ============================================================================
// Dashboard Statistics Types
// ============================================================================

export interface CMSDashboardStats {
  total_pages: number;
  published_count: number;
  draft_count: number;
  in_review_count: number;
  scheduled_count: number;
  ai_generations_this_month: number;
  ai_cost_this_month: number;
  top_authors: Array<{
    user_id: string;
    full_name?: string;
    email?: string;
    page_count: number;
  }>;
}

// ============================================================================
// Filter and Search Types
// ============================================================================

export interface PageFilters {
  status?: ContentStatus[];
  content_type?: ContentType[];
  author_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface PageListParams extends PageFilters {
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'updated_at' | 'published_at' | 'title';
  sort_order?: 'asc' | 'desc';
}

// ============================================================================
// API Response Types
// ============================================================================

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends APIResponse<T> {
  pagination?: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

// ============================================================================
// Form Types (for UI components)
// ============================================================================

export interface ContentGenerationFormData {
  contentType: ContentType;
  topic: string;
  title?: string;
  targetAudience?: TargetAudience;
  tone?: ContentTone;
  keyPoints: string[];
  wordCount?: number;
  includeImages: boolean;
  seoKeywords: string[];
}

export interface PublishFormData {
  status: ContentStatus;
  scheduled_at?: string;
  seo_metadata: SEOMetadata;
}

// ============================================================================
// Permission Types (for RBAC integration)
// ============================================================================

export type CMSPermission =
  | 'cms:view'
  | 'cms:create'
  | 'cms:edit'
  | 'cms:publish'
  | 'cms:delete';

export interface CMSUserPermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canPublish: boolean;
  canDelete: boolean;
}

// ============================================================================
// Rate Limiting Types
// ============================================================================

export interface RateLimitInfo {
  user_id: string;
  generation_count: number;
  limit: number;
  reset_at: string; // ISO timestamp
  remaining: number;
}

// ============================================================================
// Content Editor Types
// ============================================================================

export interface EditorState {
  isDirty: boolean;
  isSaving: boolean;
  lastSaved?: string;
  activeSection?: number;
  previewMode: 'desktop' | 'mobile';
  showPreview: boolean;
}

// ============================================================================
// Block Editor Types
// ============================================================================

export interface BlockDefinition {
  id: string;
  type: ContentSection['type'];
  label: string;
  icon: string;
  defaultContent: ContentSection;
}

export interface DraggableBlock {
  id: string;
  section: ContentSection;
  order: number;
}

// ============================================================================
// Export all types
// TODO: Uncomment after database migrations are applied
// ============================================================================

// export type {
//   Database,
// };
