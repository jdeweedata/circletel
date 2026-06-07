import { BlogPostCard } from '@/lib/data/cms-blog'
import { PostCard } from './PostCard'

interface RelatedPostsProps {
  posts: BlogPostCard[]
  title?: string
}

export function RelatedPosts({ posts, title = 'Related Posts' }: RelatedPostsProps) {
  if (posts.length === 0) return null

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-neutral-900 mb-6">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  )
}
