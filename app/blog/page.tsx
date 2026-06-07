import type { Metadata } from 'next'
import { getPublishedPosts, getAllCategories } from '@/lib/data/cms-blog'
import { CategoryPills } from '@/components/blog/CategoryPills'
import { PostCard } from '@/components/blog/PostCard'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Blog | CircleTel',
  description: 'Reviews, guides and connectivity news from CircleTel.',
}

interface BlogIndexPageProps {
  searchParams: Promise<{ category?: string }>
}

export default async function BlogIndexPage({ searchParams }: BlogIndexPageProps) {
  const { category } = await searchParams
  const [posts, categories] = await Promise.all([
    getPublishedPosts({ category }),
    getAllCategories(),
  ])

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      {/* Header band */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-neutral-900 mb-2 font-heading">
          CircleTel Blog
        </h1>
        <p className="text-lg text-neutral-500 mb-6">
          Reviews, guides and connectivity news
        </p>
        {/* Orange accent rule */}
        <div className="w-12 h-1 bg-[#F5831F] rounded-full" />
      </div>

      {/* Category pills */}
      <CategoryPills categories={categories} active={category} />

      {/* Featured hero + grid */}
      {posts.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-neutral-500">No posts yet. Check back soon.</p>
        </div>
      ) : (
        <>
          {/* Featured post (first one) */}
          {posts.length > 0 && (
            <PostCard post={posts[0]} variant="featured" />
          )}

          {/* Remaining posts grid */}
          {posts.length > 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.slice(1).map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  )
}
