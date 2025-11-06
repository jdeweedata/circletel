import { client, queries } from '@/lib/sanity/client'
import { PortableText } from '@/components/sanity/PortableText'
import { Metadata } from 'next'
import Link from 'next/link'

interface BlogPost {
  _id: string
  title: string
  slug: { current: string }
  excerpt?: string
  content: any[]
  author?: {
    name: string
    slug: { current: string }
    bio?: string
    email?: string
  }
  publishedAt: string
  isPublished: boolean
  seo?: {
    title?: string
    description?: string
    keywords?: string[]
  }
  _createdAt: string
}

interface BlogPostProps {
  params: Promise<{ slug: string }>
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const post = await client.fetch(queries.postBySlug, { slug })
    return post
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return null
  }
}

export async function generateMetadata({ params }: BlogPostProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPost(slug)

  if (!post) {
    return {
      title: 'Post Not Found | CircleTel Blog',
      description: 'The requested blog post could not be found.',
    }
  }

  return {
    title: post.seo?.title || `${post.title} | CircleTel Blog`,
    description: post.seo?.description || post.excerpt || '',
    keywords: post.seo?.keywords?.join(', ') || '',
    openGraph: {
      title: post.seo?.title || post.title,
      description: post.seo?.description || post.excerpt || '',
      type: 'article',
      publishedTime: post.publishedAt,
    },
  }
}

export default async function BlogPost({ params }: BlogPostProps) {
  const { slug } = await params
  const post = await getBlogPost(slug)

  if (!post || !post.isPublished) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <p className="text-gray-600 mb-8">The blog post you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/cms-blog"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-circleTel-orange hover:bg-orange-600 transition-colors"
          >
            Back to Blog
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center text-sm text-gray-500 mb-4">
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
            
            <h1 className="text-4xl md:text-5xl font-bold text-circleTel-darkNeutral mb-4">
              {post.title}
            </h1>
            
            {post.excerpt && (
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {post.excerpt}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white">
          {post.content && post.content.length > 0 && (
            <PortableText content={post.content} />
          )}
        </div>

        {/* Author Bio */}
        {post.author && post.author.bio && (
          <div className="mt-12 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-circleTel-darkNeutral mb-2">
              About the Author
            </h3>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-circleTel-orange rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {post.author.name.charAt(0)}
                  </span>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{post.author.name}</h4>
                <p className="text-gray-600 mt-1">{post.author.bio}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <Link
              href="/cms-blog"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              ← Back to Blog
            </Link>
            <div className="text-sm text-gray-500">
              Published: {new Date(post.publishedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}