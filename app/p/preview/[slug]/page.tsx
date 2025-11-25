/**
 * CMS Preview Page Route
 *
 * Renders unpublished pages for admin preview.
 * URL: /p/preview/[slug]?token=xxx
 */

import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { PageRenderer } from '@/components/cms/renderers';
import type { CMSPage, ContentBlock } from '@/lib/cms/types';
import PreviewBanner from './PreviewBanner';

// Disable caching for preview pages
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ============================================
// Types
// ============================================

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}

// ============================================
// Metadata
// ============================================

export const metadata: Metadata = {
  title: 'Preview Mode - CircleTel CMS',
  robots: { index: false, follow: false },
};

// ============================================
// Page Component
// ============================================

export default async function CMSPreviewPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { token } = await searchParams;

  // Validate preview token
  const cookieStore = await cookies();
  const storedToken = cookieStore.get('cms_preview_token')?.value;
  const storedPageId = cookieStore.get('cms_preview_page')?.value;

  if (!token || token !== storedToken) {
    redirect('/admin/cms');
  }

  const supabase = await createClient();

  // Fetch page by slug (any status for preview)
  const { data: page, error } = await supabase
    .from('pb_pages')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !page) {
    notFound();
  }

  // Verify this is the page we have preview access to
  if (page.id !== storedPageId) {
    redirect('/admin/cms');
  }

  const cmsPage = page as CMSPage;

  // Extract blocks from content
  const content = cmsPage.content as { blocks?: ContentBlock[] };
  const blocks = content?.blocks || [];

  return (
    <>
      {/* Preview Banner */}
      <PreviewBanner
        pageId={cmsPage.id}
        pageTitle={cmsPage.title}
        status={cmsPage.status}
      />

      {/* Page Content */}
      <PageRenderer blocks={blocks} theme={cmsPage.theme} />
    </>
  );
}
