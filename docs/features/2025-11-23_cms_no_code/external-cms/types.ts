export interface HeroSection {
  headline: string;
  subheadline: string;
  cta: string;
}

export interface ContentSection {
  heading: string;
  content: string;
}

export interface SeoMetadata {
  title: string;
  description: string;
}

export interface PageContent {
  hero: HeroSection;
  sections: ContentSection[];
  seo: SeoMetadata;
  image_prompt: string;
}

export type PageStatus = 'draft' | 'published' | 'archived';

export interface Page {
  id: string;
  slug: string;
  title: string;
  content_type: string;
  status: PageStatus;
  content: PageContent;
  featured_image?: string;
  created_at: string;
  updated_at: string;
}

export interface GenerationParams {
  topic: string;
  type: string;
  tone: string;
  targetAudience?: string;
  keywords?: string;
  imageStyle?: string;
}