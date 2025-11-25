import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SliceZone } from '@prismicio/react';

import { createClient } from '@/lib/prismicio';
import { components } from '@/slices';

/**
 * Prismic Dynamic Page Route
 *
 * Renders pages built with Prismic Slice Machine
 * Features:
 * - Dynamic routing by UID
 * - SEO metadata from Prismic
 * - SliceZone for modular content
 * - Live preview support
 */

type Params = { slug: string };

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const client = createClient();

  try {
    const page = await client.getByUID('page', slug);

    return {
      title: page.data.meta_title || page.data.title || 'CircleTel',
      description: page.data.meta_description || '',
      openGraph: {
        title: page.data.meta_title || page.data.title || 'CircleTel',
        description: page.data.meta_description || '',
        images: page.data.meta_image?.url
          ? [
              {
                url: page.data.meta_image.url,
                width: 1200,
                height: 630,
              },
            ]
          : [],
      },
    };
  } catch {
    return {
      title: 'Page Not Found',
    };
  }
}

// Generate static paths for all pages
export async function generateStaticParams() {
  const client = createClient();

  const pages = await client.getAllByType('page');

  return pages.map((page) => {
    return { slug: page.uid };
  });
}

// Main page component
export default async function Page({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const client = createClient();

  try {
    const page = await client.getByUID('page', slug);

    return (
      <div className="min-h-screen">
        <SliceZone slices={page.data.slices} components={components} />
      </div>
    );
  } catch {
    notFound();
  }
}
