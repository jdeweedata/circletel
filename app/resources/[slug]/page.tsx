import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { sanityFetch } from '@/lib/sanity/fetch'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { PortableText } from '@/components/sanity/primitives'
import { PortableTextBlock } from '@portabletext/react'

/**
 * Sanity Resource Page Route
 *
 * Renders downloadable resources, guides, and documentation
 */

interface ResourceData {
  _id: string
  title: string
  slug: string
  resourceType?: string
  description?: string
  thumbnail?: { asset?: { url?: string }; alt?: string }
  accessLevel?: string
  file?: { asset?: { url?: string } }
  externalUrl?: string
  body?: PortableTextBlock[]
  seo?: {
    metaTitle?: string
    metaDescription?: string
  }
}

type Params = { slug: string }

const RESOURCE_QUERY = `*[_type == "resource" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  resourceType,
  description,
  thumbnail {
    asset->{url},
    alt
  },
  accessLevel,
  file {
    asset->{url}
  },
  externalUrl,
  body,
  seo
}`

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params

  const resource = await sanityFetch<ResourceData | null>({
    query: RESOURCE_QUERY,
    params: { slug },
    tags: [`resource:${slug}`, 'resources'],
  })

  if (!resource) {
    return { title: 'Resource Not Found' }
  }

  return {
    title: resource.seo?.metaTitle || `${resource.title} | CircleTel Resources`,
    description: resource.seo?.metaDescription || resource.description || 'CircleTel Resources',
  }
}

export async function generateStaticParams() {
  const resources = await sanityFetch<{ slug: string }[]>({
    query: `*[_type == "resource" && defined(slug.current)]{ "slug": slug.current }`,
    params: {},
    tags: ['resources'],
  })

  return resources.map((r) => ({ slug: r.slug }))
}

export default async function ResourcePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params

  const resource = await sanityFetch<ResourceData | null>({
    query: RESOURCE_QUERY,
    params: { slug },
    tags: [`resource:${slug}`, 'resources'],
  })

  if (!resource) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <article className="container mx-auto px-4 py-12">
          <header className="max-w-3xl mx-auto mb-8">
            {resource.resourceType && (
              <span className="text-sm font-medium text-circleTel-orange uppercase tracking-wide">
                {resource.resourceType}
              </span>
            )}
            <h1 className="text-4xl font-heading font-bold mt-2 mb-4">
              {resource.title}
            </h1>
            {resource.description && (
              <p className="text-xl text-gray-600">{resource.description}</p>
            )}
          </header>

          {resource.body && (
            <div className="max-w-3xl mx-auto prose prose-lg">
              <PortableText value={resource.body} />
            </div>
          )}

          {(resource.file?.asset?.url || resource.externalUrl) && (
            <div className="max-w-3xl mx-auto mt-8">
              <a
                href={resource.file?.asset?.url || resource.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-circleTel-orange text-white font-medium rounded-lg hover:bg-circleTel-orange/90 transition-colors"
              >
                {resource.resourceType === 'guide' ? 'Download Guide' : 'Access Resource'}
              </a>
            </div>
          )}
        </article>
      </main>
      <Footer />
    </div>
  )
}
