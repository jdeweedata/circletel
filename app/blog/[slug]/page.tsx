import { queries } from '@/lib/sanity/client'
import { sanityFetch } from '@/lib/sanity/live'
import { SanityImage } from '@/components/sanity/SanityImage'
import { PortableText } from '@/components/sanity/PortableText'
import { format } from 'date-fns'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const { data: post } = await sanityFetch({
    query: queries.postBySlug,
    params: { slug },
    tags: [`post:${slug}`]
  })

  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  return {
    title: `${post.title} | CircleTel Blog`,
    description: post.seo?.description || post.excerpt,
    openGraph: {
      images: post.mainImage ? [
        {
          url: post.mainImage.asset?.url || '', // This would need resolving via urlFor in real meta tag generation
        }
      ] : [],
    }
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const { data: post } = await sanityFetch({
    query: queries.postBySlug,
    params: { slug },
    tags: [`post:${slug}`]
  })

  if (!post) {
    notFound()
  }

  return (
    <article className="container mx-auto px-4 py-12 max-w-4xl">
      <Link 
        href="/blog" 
        className="inline-flex items-center text-gray-600 hover:text-circleTel-orange mb-8 transition-colors"
      >
        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Blog
      </Link>

      <header className="mb-10">
        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
          {post.publishedAt && (
            <time dateTime={post.publishedAt}>
              {format(new Date(post.publishedAt), 'MMMM d, yyyy')}
            </time>
          )}
          {post.category && (
            <>
              <span>•</span>
              <span className="bg-gray-100 px-3 py-1 rounded-full text-gray-700 font-medium">
                {post.category.title}
              </span>
            </>
          )}
        </div>

        <h1 className="text-3xl md:text-5xl font-bold text-circleTel-darkNeutral mb-6 leading-tight">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-xl text-gray-600 leading-relaxed border-l-4 border-circleTel-orange pl-6 italic">
            {post.excerpt}
          </p>
        )}

        {post.author && (
          <div className="flex items-center mt-8 p-4 bg-gray-50 rounded-lg">
            {post.author.image && (
              <div className="w-12 h-12 rounded-full overflow-hidden mr-4 relative">
                <SanityImage 
                  image={post.author.image} 
                  alt={post.author.name}
                  fill
                />
              </div>
            )}
            <div>
              <div className="font-bold text-gray-900">{post.author.name}</div>
              {post.author.bio && (
                <div className="text-sm text-gray-600">{post.author.bio}</div>
              )}
            </div>
          </div>
        )}
      </header>

      {post.mainImage && (
        <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden mb-12 shadow-lg">
          <SanityImage
            image={post.mainImage}
            alt={post.title}
            fill
            priority
          />
        </div>
      )}

      <div className="prose prose-lg max-w-none prose-headings:text-circleTel-darkNeutral prose-a:text-circleTel-orange hover:prose-a:text-orange-600">
        <PortableText content={post.content} />
      </div>
    </article>
  )
}
