import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { sanityFetch } from '@/lib/sanity/fetch'
import { BlockRenderer } from '@/components/sanity/BlockRenderer'
import { SanitySection } from '@/lib/sanity/types'

/**
 * Sanity Dynamic Page Route
 *
 * Renders pages built with Sanity page builder
 * Features:
 * - Dynamic routing by slug
 * - SEO metadata from Sanity
 * - BlockRenderer for modular content
 * - ISR with tag-based revalidation
 */

interface PageData {
  _id: string
  title: string
  slug: string
  seo?: {
    metaTitle?: string
    metaDescription?: string
    ogImage?: { asset?: { url?: string } }
  }
  blocks?: SanitySection[]
}

type Params = { slug: string }

const PAGE_QUERY = `*[_type == "page" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  seo,
  blocks[]{
    _key,
    _type,
    ...
  }
}`

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params

  const page = await sanityFetch<PageData | null>({
    query: PAGE_QUERY,
    params: { slug },
    tags: [`page:${slug}`, 'pages'],
  })

  if (!page) {
    return { title: 'Page Not Found' }
  }

  return {
    title: page.seo?.metaTitle || page.title || 'CircleTel',
    description: page.seo?.metaDescription || '',
    openGraph: {
      title: page.seo?.metaTitle || page.title || 'CircleTel',
      description: page.seo?.metaDescription || '',
      images: page.seo?.ogImage?.asset?.url
        ? [{ url: page.seo.ogImage.asset.url, width: 1200, height: 630 }]
        : [],
    },
  }
}

export async function generateStaticParams() {
  const pages = await sanityFetch<{ slug: string }[]>({
    query: `*[_type == "page" && defined(slug.current)]{ "slug": slug.current }`,
    params: {},
    tags: ['pages'],
  })

  return pages.map((page) => ({ slug: page.slug }))
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { slug } = await params

  const page = await sanityFetch<PageData | null>({
    query: PAGE_QUERY,
    params: { slug },
    tags: [`page:${slug}`, 'pages'],
  })

  if (!page) {
    notFound()
  }

  return (
    <main className="min-h-screen">
      <BlockRenderer sections={page.blocks || []} />
    </main>
  )
}
