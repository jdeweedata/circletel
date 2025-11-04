import { client, queries } from '@/lib/sanity/client'
import Link from 'next/link'
import { Metadata } from 'next'

interface BlogPost {
  _id: string
  title: string
  slug: { current: string }
  excerpt?: string
  author?: {
    name: string
    slug: { current: string }
    bio?: string
  }
  publishedAt: string
  isPublished: boolean
  _createdAt: string
}

export const metadata: Metadata = {
  title: 'Blog | CircleTel',
  description: 'Latest news, updates, and insights from CircleTel',
}

async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const posts = await client.fetch(queries.posts)
    return posts?.filter((post: BlogPost) => post.isPublished) || []
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return []
  }
}

export default async function CMSBlog() {
  const posts = await getBlogPosts()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-circleTel-darkNeutral mb-4">
              CircleTel Blog
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Latest news, updates, and insights from South Africa&apos;s fastest-growing ISP
            </p>
          </div>
        </div>
      </div>

      {/* Blog Posts */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-gray-900 mb-2">No blog posts found</h3>
            <p className="text-gray-600">
              No published blog posts are currently available.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            {posts.map((post) => (
              <article
                key={post._id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <time dateTime={post.publishedAt}>
                      {new Date(post.publishedAt).toLocaleDateString('en-ZA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                    {post.author && (
                      <>
                        <span className="mx-2">•</span>
                        <span>By {post.author.name}</span>
                      </>
                    )}
                  </div>
                  
                  <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-3 line-clamp-2">
                    {post.title}
                  </h2>
                  
                  {post.excerpt && (
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                  
                  <Link
                    href={`/cms-blog/${post.slug.current}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-circleTel-orange hover:bg-orange-600 transition-colors"
                  >
                    Read More
                    <svg
                      className="ml-2 w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Link>
                </div>
              </article>
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