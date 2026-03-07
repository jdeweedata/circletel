import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { sanityFetch } from '@/lib/sanity/fetch'
import { BlockRenderer } from '@/components/sanity/BlockRenderer'
import { SanitySection } from '@/lib/sanity/types'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

/**
 * Sanity Service Page Route
 *
 * Renders service pages with hero, benefits, and content blocks
 */

interface ServicePageData {
  _id: string
  name: string
  slug: string
  category?: string
  tagline?: string
  heroImage?: { asset?: { url?: string }; alt?: string }
  benefits?: Array<{ title: string; description: string; icon?: string }>
  seo?: {
    metaTitle?: string
    metaDescription?: string
  }
  blocks?: SanitySection[]
}

type Params = { slug: string }

const SERVICE_PAGE_QUERY = `*[_type == "servicePage" && slug.current == $slug][0]{
  _id,
  name,
  "slug": slug.current,
  category,
  tagline,
  heroImage {
    asset->{url},
    alt
  },
  benefits,
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

  const page = await sanityFetch<ServicePageData | null>({
    query: SERVICE_PAGE_QUERY,
    params: { slug },
    tags: [`service:${slug}`, 'services'],
  })

  if (!page) {
    return { title: 'Service Not Found' }
  }

  return {
    title: page.seo?.metaTitle || `${page.name} | CircleTel`,
    description: page.seo?.metaDescription || page.tagline || 'CircleTel Services',
  }
}

export async function generateStaticParams() {
  const pages = await sanityFetch<{ slug: string }[]>({
    query: `*[_type == "servicePage" && defined(slug.current)]{ "slug": slug.current }`,
    params: {},
    tags: ['services'],
  })

  return pages.map((page) => ({ slug: page.slug }))
}

export default async function ServicePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params

  const page = await sanityFetch<ServicePageData | null>({
    query: SERVICE_PAGE_QUERY,
    params: { slug },
    tags: [`service:${slug}`, 'services'],
  })

  if (!page) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <BlockRenderer sections={page.blocks || []} />
      </main>
      <Footer />
    </div>
  )
}
