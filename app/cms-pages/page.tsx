import { client, queries } from '@/lib/sanity/client'
import Link from 'next/link'
import { Metadata } from 'next'

interface Page {
  _id: string
  title: string
  slug: { current: string }
  excerpt?: string
  _createdAt: string
}

export const metadata: Metadata = {
  title: 'CMS Pages | CircleTel',
  description: 'Browse all content pages managed through our CMS',
}

async function getPages(): Promise<Page[]> {
  try {
    const pages = await client.fetch(queries.pages)
    return pages || []
  } catch (error) {
    console.error('Error fetching pages:', error)
    return []
  }
}

export default async function CMSPagesIndex() {
  const pages = await getPages()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-circleTel-darkNeutral mb-4">
              CMS Pages
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Content pages managed through Sanity CMS
            </p>
          </div>
        </div>
      </div>

      {/* Pages Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {pages.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-gray-900 mb-2">No pages found</h3>
            <p className="text-gray-600">
              No content pages are currently available from the CMS.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {pages.map((page) => (
              <div
                key={page._id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-circleTel-darkNeutral mb-3">
                    {page.title}
                  </h2>
                  {page.excerpt && (
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {page.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {new Date(page._createdAt).toLocaleDateString()}
                    </span>
                    <Link
                      href={`/cms-pages/${page.slug.current}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-circleTel-orange hover:bg-orange-600 transition-colors"
                    >
                      View Page
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}