import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPostBySlug, getPostSlugs, getRelatedPosts, primaryCategory } from '@/lib/data/cms-blog'
import { Breadcrumb } from '@/components/blog/Breadcrumb'
import { ShareButtons } from '@/components/blog/ShareButtons'
import { SalesCtaCard } from '@/components/blog/SalesCtaCard'
import { NewsletterSignup } from '@/components/blog/NewsletterSignup'
import { RelatedPosts } from '@/components/blog/RelatedPosts'
import { SalesCtaBanner } from '@/components/blog/SalesCtaBanner'
import { ArticleJsonLd } from '@/components/blog/ArticleJsonLd'
import { categoryLabel } from '@/lib/blog/categories'

export const revalidate = 300

type Params = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const slugs = await getPostSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: 'Post not found | CircleTel' }
  const description = post.metaDescription ?? post.excerpt ?? undefined
  return {
    title: `${post.metaTitle ?? post.title} | CircleTel`,
    description,
    openGraph: {
      title: post.metaTitle ?? post.title,
      description,
      images: post.featuredImageHeroUrl ? [{ url: post.featuredImageHeroUrl }] : undefined,
      type: 'article',
    },
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const primaryCat = primaryCategory(post.categories)
  const relatedPosts = await getRelatedPosts(slug, primaryCat, 4)

  const postUrl = `https://www.circletel.co.za/blog/${slug}`

  return (
    <>
      <ArticleJsonLd post={post} url={postUrl} />

      <article className="mx-auto max-w-6xl px-4 py-12">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Blog', href: '/blog' },
            ...(primaryCat ? [{ label: categoryLabel(primaryCat), href: `/blog?category=${encodeURIComponent(primaryCat)}` }] : []),
            { label: post.title },
          ]}
        />

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: article content */}
          <div className="lg:col-span-2">
            {/* Eyebrow category pill */}
            {primaryCat && (
              <div className="mb-4 inline-block">
                <span className="px-3 py-1 bg-[#F5831F] text-white text-xs font-semibold rounded-full">
                  {categoryLabel(primaryCat)}
                </span>
              </div>
            )}

            {/* H1 */}
            <h1 className="text-4xl font-bold text-neutral-900 mb-4 font-heading leading-tight">
              {post.title}
            </h1>

            {/* Meta row */}
            <div className="flex items-center gap-2 text-sm text-neutral-500 mb-6 pb-6 border-b border-neutral-200">
              {post.authorName && <span>{post.authorName}</span>}
              {post.authorName && formatDate(post.publishedAt) && <span>·</span>}
              {formatDate(post.publishedAt) && <span>{formatDate(post.publishedAt)}</span>}
              {post.readMinutes && (
                <>
                  <span>·</span>
                  <span>{post.readMinutes} min read</span>
                </>
              )}
            </div>

            {/* Hero image */}
            {post.featuredImageHeroUrl && (
              <div className="mb-8 overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.featuredImageHeroUrl}
                  alt={post.featuredImageAlt ?? post.title}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}

            {/* Body prose */}
            {post.contentHtml && (
              <div
                className="prose prose-neutral max-w-none mb-12
                  prose-a:text-[#F5831F] prose-a:no-underline hover:prose-a:underline
                  prose-headings:text-neutral-900 prose-headings:font-heading prose-headings:font-bold
                  prose-h2:text-2xl prose-h3:text-xl
                  prose-img:rounded-lg prose-img:my-6
                  prose-strong:text-neutral-900
                  prose-blockquote:border-l-[#F5831F] prose-blockquote:italic
                "
                dangerouslySetInnerHTML={{ __html: post.contentHtml }}
              />
            )}

            {/* Author byline */}
            {post.authorName && (
              <div className="py-6 border-y border-neutral-200 mb-12">
                <p className="text-sm text-neutral-600">
                  <span className="font-semibold">{post.authorName}</span> is the author of this article.
                </p>
              </div>
            )}

            {/* Related posts grid at bottom of article */}
            {relatedPosts.length > 0 && (
              <RelatedPosts posts={relatedPosts.slice(0, 3)} title="Read More" />
            )}
          </div>

          {/* Right column: sticky sidebar */}
          <aside className="lg:col-span-1">
            <div className="space-y-6 lg:sticky lg:top-24">
              {/* Share buttons */}
              <ShareButtons url={postUrl} title={post.title} />

              {/* Sales CTA card */}
              <SalesCtaCard />

              {/* Newsletter signup */}
              <NewsletterSignup />

              {/* Sidebar related posts */}
              {relatedPosts.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-neutral-900">Recent Posts</h3>
                  <div className="space-y-3">
                    {relatedPosts.slice(0, 4).map((relPost) => (
                      <a
                        key={relPost.id}
                        href={`/blog/${relPost.slug}`}
                        className="flex gap-3 group"
                      >
                        {relPost.featuredImageThumbUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={relPost.featuredImageThumbUrl}
                            alt={relPost.featuredImageAlt ?? relPost.title}
                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0 group-hover:opacity-80 transition"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-neutral-900 group-hover:text-[#F5831F] transition line-clamp-2">
                            {relPost.title}
                          </h4>
                          <p className="text-xs text-neutral-500 mt-1">
                            {formatDate(relPost.publishedAt)}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Bottom sales CTA banner */}
        <SalesCtaBanner />
      </article>
    </>
  )
}
