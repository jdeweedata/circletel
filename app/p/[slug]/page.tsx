/**
 * CMS Public Page Route
 *
 * Dynamic route for rendering published CMS pages.
 * URL: /p/[slug]
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageRenderer } from '@/components/cms/renderers';
import type { CMSPage, ContentBlock, SEOMetadata } from '@/lib/cms/types';

// Enable ISR with 60 second revalidation
export const revalidate = 60;

// ============================================
// Types
// ============================================

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ============================================
// Data Fetching
// ============================================

async function getPage(slug: string): Promise<CMSPage | null> {
  const supabase = await createClient();

  const { data: page, error } = await supabase
    .from('pb_pages')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !page) {
    return null;
  }

  return page as CMSPage;
}

// ============================================
// SEO Metadata Generation
// ============================================

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    return {
      title: 'Page Not Found',
      description: 'The requested page could not be found.',
    };
  }

  const seo: SEOMetadata = page.seo_metadata || {};
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.circletel.co.za';

  return {
    title: seo.title || page.title,
    description: seo.description || `${page.title} - CircleTel`,
    keywords: seo.keywords?.join(', '),
    openGraph: {
      title: seo.ogTitle || seo.title || page.title,
      description: seo.ogDescription || seo.description || `${page.title} - CircleTel`,
      images: seo.ogImage ? [{ url: seo.ogImage }] : [],
      url: `${baseUrl}/p/${slug}`,
      type: 'website',
      siteName: 'CircleTel',
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.ogTitle || seo.title || page.title,
      description: seo.ogDescription || seo.description || `${page.title} - CircleTel`,
      images: seo.ogImage ? [seo.ogImage] : [],
    },
    alternates: {
      canonical: seo.canonicalUrl || `${baseUrl}/p/${slug}`,
    },
    robots: {
      index: !seo.noIndex,
      follow: !seo.noFollow,
    },
  };
}

// ============================================
// Static Params Generation (for SSG)
// ============================================

export async function generateStaticParams() {
  const supabase = await createClient();

  const { data: pages } = await supabase
    .from('pb_pages')
    .select('slug')
    .eq('status', 'published')
    .limit(100);

  return (pages || []).map((page) => ({
    slug: page.slug,
  }));
}

// ============================================
// Page Component
// ============================================

export default async function CMSPublicPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    notFound();
  }

  // Extract blocks from content
  const content = page.content as { blocks?: ContentBlock[] };
  const blocks = content?.blocks || [];

  // Generate structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title,
    description: page.seo_metadata?.description || page.title,
    url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.circletel.co.za'}/p/${slug}`,
    datePublished: page.published_at,
    dateModified: page.updated_at,
    publisher: {
      '@type': 'Organization',
      name: 'CircleTel',
      url: 'https://www.circletel.co.za',
    },
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Page Content */}
      <PageRenderer blocks={blocks} theme={page.theme} />
    </>
  );
}
