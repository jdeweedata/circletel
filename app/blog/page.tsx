import Link from 'next/link'
import { queries } from '@/lib/sanity/client'
import { sanityFetch } from '@/lib/sanity/live'
import { SanityImage } from '@/components/sanity/SanityImage'
import { format } from 'date-fns'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog | CircleTel',
  description: 'Latest news, updates, and insights from CircleTel.',
}

export default async function BlogPage() {
  const { data: posts } = await sanityFetch({
    query: queries.posts,
    // tags are handled automatically by Sanity Live, but can be passed for manual revalidation
  })

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-circleTel-darkNeutral mb-4">
          Latest News & Insights
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Stay updated with the latest trends in connectivity, managed services, and CircleTel announcements.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-900">No posts found</h3>
          <p className="text-gray-600 mt-2">Check back later for updates.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post: any) => (
            <Link 
              href={`/blog/${post.slug.current}`} 
              key={post._id}
              className="group flex flex-col bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100"
            >
              {post.mainImage && (
                <div className="relative h-48 w-full overflow-hidden">
                  <SanityImage
                    image={post.mainImage}
                    alt={post.title}
                    fill
                    className="group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center text-sm text-gray-500 mb-3 space-x-2">
                  {post.publishedAt && (
                    <time dateTime={post.publishedAt}>
                      {format(new Date(post.publishedAt), 'MMMM d, yyyy')}
                    </time>
                  )}
                  {post.author && (
                    <>
                      <span>•</span>
                      <span>{post.author.name}</span>
                    </>
                  )}
                </div>
                
                <h2 className="text-xl font-bold text-circleTel-darkNeutral mb-2 group-hover:text-circleTel-orange transition-colors line-clamp-2">
                  {post.title}
                </h2>
                
                {post.excerpt && (
                  <p className="text-gray-600 mb-4 line-clamp-3 flex-1">
                    {post.excerpt}
                  </p>
                )}
                
                <div className="mt-auto pt-4 flex items-center text-circleTel-orange font-medium">
                  Read Article 
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
