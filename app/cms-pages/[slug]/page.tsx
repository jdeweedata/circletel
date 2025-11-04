import { client, queries } from '@/lib/sanity/client'
import { PortableText } from '@/components/sanity/PortableText'
import { Metadata } from 'next'
import Link from 'next/link'

interface Page {
  _id: string
  title: string
  slug: { current: string }
  excerpt?: string
  content: any[]
  image?: any
  seo?: {
    title?: string
    description?: string
    keywords?: string[]
  }
  _createdAt: string
}

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getPage(slug: string): Promise<Page | null> {
  try {
    const page = await client.fetch(queries.pageBySlug, { slug })
    return page
  } catch (error) {
    console.error('Error fetching page:', error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const page = await getPage(slug)

  if (!page) {
    return {
      title: 'Page Not Found | CircleTel',
      description: 'The requested page could not be found.',
    }
  }

  return {
    title: page.seo?.title || page.title,
    description: page.seo?.description || page.excerpt || '',
    keywords: page.seo?.keywords?.join(', ') || '',
    openGraph: {
      title: page.seo?.title || page.title,
      description: page.seo?.description || page.excerpt || '',
      type: 'website',
    },
  }
}

export default async function CMSPage({ params }: PageProps) {
  const { slug } = await params
  const page = await getPage(slug)

  if (!page) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
          <p className="text-gray-600 mb-8">The page you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-circleTel-orange hover:bg-orange-600 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-circleTel-orange to-orange-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {page.title}
            </h1>
            {page.excerpt && (
              <p className="text-xl text-orange-100 max-w-3xl mx-auto">
                {page.excerpt}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white">
          {page.content && page.content.length > 0 && (
            <PortableText content={page.content} />
          )}
        </div>

        {/* Navigation */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <Link
              href="/cms-pages"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              ← Back to Pages
            </Link>
            <div className="text-sm text-gray-500">
              Last updated: {new Date(page._createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}