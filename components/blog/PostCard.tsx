import Link from 'next/link'
import { BlogPostCard } from '@/lib/data/cms-blog'
import { categoryLabel } from '@/lib/blog/categories'

interface PostCardProps {
  post: BlogPostCard
  variant?: 'default' | 'featured'
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function PostCard({ post, variant = 'default' }: PostCardProps) {
  if (variant === 'featured') {
    return (
      <article className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 border border-neutral-200 rounded-lg overflow-hidden hover:border-neutral-300 transition">
        {/* Image */}
        {post.featuredImageThumbUrl && (
          <div className="aspect-video overflow-hidden">
            <img
              src={post.featuredImageThumbUrl}
              alt={post.featuredImageAlt ?? post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col justify-center p-6">
          {/* Category pill */}
          {post.categories.length > 0 && (
            <div className="inline-flex w-fit mb-3">
              <span className="px-3 py-1 bg-[#F5831F] text-white text-xs font-semibold rounded-full">
                {categoryLabel(post.categories[0])}
              </span>
            </div>
          )}

          {/* Title */}
          <Link href={`/blog/${post.slug}`}>
            <h2 className="text-2xl font-bold text-neutral-900 hover:text-[#F5831F] transition mb-3 line-clamp-3">
              {post.title}
            </h2>
          </Link>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-neutral-600 line-clamp-3 mb-4">{post.excerpt}</p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-1 text-sm text-neutral-500">
            {post.authorName && <span>{post.authorName}</span>}
            {post.authorName && formatDate(post.publishedAt) && <span>·</span>}
            {formatDate(post.publishedAt) && <span>{formatDate(post.publishedAt)}</span>}
          </div>
        </div>
      </article>
    )
  }

  // Default variant
  return (
    <article className="group block border border-neutral-200 rounded-lg overflow-hidden hover:border-neutral-300 hover:shadow-md transition">
      {/* Image */}
      {post.featuredImageThumbUrl && (
        <div className="aspect-video overflow-hidden bg-neutral-100">
          <img
            src={post.featuredImageThumbUrl}
            alt={post.featuredImageAlt ?? post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        {/* Category tag */}
        {post.categories.length > 0 && (
          <div className="mb-3 inline-block">
            <span className="px-2.5 py-1 bg-[#F5831F] text-white text-xs font-semibold rounded-full">
              {categoryLabel(post.categories[0])}
            </span>
          </div>
        )}

        {/* Title */}
        <Link href={`/blog/${post.slug}`}>
          <h3 className="text-lg font-bold text-neutral-900 group-hover:text-[#F5831F] transition mb-2 line-clamp-2">
            {post.title}
          </h3>
        </Link>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-sm text-neutral-600 mb-4 line-clamp-3">
            {post.excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-1 text-xs text-neutral-500">
          {post.authorName && <span>{post.authorName}</span>}
          {post.authorName && formatDate(post.publishedAt) && <span>·</span>}
          {formatDate(post.publishedAt) && <span>{formatDate(post.publishedAt)}</span>}
        </div>
      </div>
    </article>
  )
}
